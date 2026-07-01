import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import type { H3Index, ExploredCell } from '@/types';
import { insertCell, loadAllCells, getDatabase } from '@/database/db';
import * as Location from 'expo-location';
import {
  buildExploredUnion,
  extendExploredUnion,
  computeFogPolygon,
  WORLD_BBOX,
} from '@/utils/geoUtils';

// ─── Types du store ───────────────────────────────────────────────────────────

export interface ExplorationStoreState {
  /** Source de vérité : Set pour lookups O(1) depuis le background task. */
  exploredCells: Set<H3Index>;

  /** Dictionnaire complet des cellules avec coordonnées et géocodage. */
  exploredCellsDetails: Map<H3Index, ExploredCell>;

  /**
   * Union fusionnée de tous les hexagones explorés.
   * Mise à jour de façon incrémentale à chaque nouvel hexagone.
   */
  exploredUnion: Feature<Polygon | MultiPolygon> | null;

  /**
   * Polygone de brouillard prêt pour Mapbox = monde - exploredUnion.
   * C'est l'unique feature passée au ShapeSource Mapbox.
   */
  fogPolygon: Feature<Polygon | MultiPolygon>;

  /** true pendant le chargement initial depuis SQLite. */
  isLoading: boolean;

  /** Timestamp de la dernière cellule ajoutée. Utilisé pour les stats. */
  lastUpdatedAt: number | null;

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Ajoute une cellule H3 découverte.
   * - Vérifie si déjà connue (O(1))
   * - Sauvegarde en SQLite (fire-and-forget)
   * - Mise à jour incrémentale du fogPolygon
   */
  addCell: (index: H3Index, lat: number, lng: number) => void;

  /**
   * Charge toutes les cellules depuis SQLite et reconstruit le fog de zéro.
   * Appelé une fois au démarrage de l'app.
   */
  loadFromDatabase: () => Promise<void>;

  /**
   * Géocode en tâche de fond (lazy) toutes les cellules n'ayant pas encore
   * de pays ou ville défini (ex: résidus hors-ligne ou importations).
   */
  startLazyGeocoding: () => Promise<void>;
}

// ─── Debounce de reconstruction (batch) ──────────────────────────────────────
// Quand plusieurs cellules arrivent rapidement (ex: reprise du tracking),
// on accumule les nouvelles cellules et on recalcule le fog une seule fois.

let pendingNewCells: H3Index[] = [];
let rebuildScheduled = false;

function scheduleBatchRebuild(store: ReturnType<typeof createStore>) {
  if (rebuildScheduled) return;
  rebuildScheduled = true;

  // setTimeout(0) laisse React finir le rendu courant avant de recalculer
  setTimeout(() => {
    rebuildScheduled = false;
    const toProcess = [...pendingNewCells];
    pendingNewCells = [];

    if (toProcess.length === 0) return;

    const { exploredUnion } = store.getState();
    const { exploredUnion: newUnion, fogPolygon } = extendExploredUnion(
      exploredUnion,
      toProcess
    );

    store.setState({
      exploredUnion: newUnion,
      fogPolygon,
    });
  }, 0);
}

// ─── Store Zustand ────────────────────────────────────────────────────────────

const createStore = () =>
  create<ExplorationStoreState>()(
    subscribeWithSelector((set, get) => ({
      exploredCells: new Set<H3Index>(),
      exploredCellsDetails: new Map<H3Index, ExploredCell>(),
      exploredUnion: null,
      fogPolygon: WORLD_BBOX,
      isLoading: false,
      lastUpdatedAt: null,

      addCell: (index: H3Index, lat: number, lng: number) => {
        const { exploredCells, exploredCellsDetails } = get();

        // Déduplication O(1) — ne rien faire si déjà explorée
        if (exploredCells.has(index)) return;

        const discoveredAt = Date.now();
        const newCell: ExploredCell = { index, discoveredAt, lat, lng };

        // 1. Créer un nouveau Set et Map (Zustand exige l'immutabilité)
        const newCells = new Set(exploredCells);
        newCells.add(index);

        const newDetails = new Map(exploredCellsDetails);
        newDetails.set(index, newCell);

        // 2. Mettre à jour le Set et les Détails immédiatement (réactivité UI)
        set({
          exploredCells: newCells,
          exploredCellsDetails: newDetails,
          lastUpdatedAt: discoveredAt,
        });

        // 3. Accumuler pour la mise à jour incrémentale du fog (batché)
        pendingNewCells.push(index);
        scheduleBatchRebuild(useExplorationStore);

        // 4. Géocodage inverse asynchrone et persistance SQLite (fire-and-forget)
        (async () => {
          let country: string | null = null;
          let city: string | null = null;
          try {
            const geocoded = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            if (geocoded && geocoded.length > 0) {
              country = geocoded[0].country || null;
              city = geocoded[0].city || geocoded[0].subregion || geocoded[0].region || null;
            }
          } catch (e) {
            console.warn('[ExplorationStore] Background geocoding failed:', e);
          }

          // Si le géocodage a trouvé des infos, on met à jour en mémoire
          if (country || city) {
            const currentDetails = get().exploredCellsDetails;
            const existingCell = currentDetails.get(index);
            if (existingCell) {
              const updatedCell = { ...existingCell, country, city };
              const updatedDetails = new Map(currentDetails);
              updatedDetails.set(index, updatedCell);
              set({ exploredCellsDetails: updatedDetails });
            }
          }

          await insertCell({ index, discoveredAt, lat, lng, country, city });
        })().catch((err) =>
          console.error('[ExplorationStore] insertCell failed:', err)
        );
      },

      loadFromDatabase: async () => {
        set({ isLoading: true });
        try {
          const cells = await loadAllCells();
          const cellSet = new Set(cells.map((c) => c.index));

          const cellDetails = new Map<H3Index, ExploredCell>();
          for (const cell of cells) {
            cellDetails.set(cell.index, cell);
          }

          // Reconstruction du fog depuis zéro (chargement initial)
          const exploredUnion = buildExploredUnion([...cellSet]);
          const fogPolygon = computeFogPolygon(exploredUnion);

          set({
            exploredCells: cellSet,
            exploredCellsDetails: cellDetails,
            exploredUnion,
            fogPolygon,
            isLoading: false,
            lastUpdatedAt: cells.length > 0 ? cells[cells.length - 1].discoveredAt : null,
          });

          // Lancement automatique du géocodage différé pour combler les manques
          get().startLazyGeocoding();
        } catch (err) {
          console.error('[ExplorationStore] loadFromDatabase error:', err);
          set({ isLoading: false });
        }
      },

      startLazyGeocoding: async () => {
        const { exploredCellsDetails } = get();
        // Filtrer les cellules n'ayant aucun pays renseigné
        const cellsToGeocode = Array.from(exploredCellsDetails.values()).filter(
          (c) => !c.country
        );

        if (cellsToGeocode.length === 0) return;

        console.log(`[ExplorationStore] Démarrage du géocodage différé pour ${cellsToGeocode.length} cellules.`);

        // Lancement en tâche de fond (asynchrone)
        (async () => {
          for (const cell of cellsToGeocode) {
            // Vérifier si la cellule a été résolue entre temps
            const latestCell = get().exploredCellsDetails.get(cell.index);
            if (!latestCell || latestCell.country) continue;

            try {
              const geocoded = await Location.reverseGeocodeAsync({
                latitude: cell.lat,
                longitude: cell.lng,
              });

              if (geocoded && geocoded.length > 0) {
                const country = geocoded[0].country || 'Inconnu';
                const city = geocoded[0].city || geocoded[0].subregion || geocoded[0].region || 'Inconnu';

                // Enregistrer dans la base de données
                const db = getDatabase();
                await db.runAsync(
                  'UPDATE explored_cells SET country = ?, city = ? WHERE h3_index = ?',
                  [country, city, cell.index]
                );

                // Mettre à jour l'état en mémoire
                const currentDetails = get().exploredCellsDetails;
                const updatedCell = { ...cell, country, city };
                const updatedDetails = new Map(currentDetails);
                updatedDetails.set(cell.index, updatedCell);
                set({ exploredCellsDetails: updatedDetails });
              }
            } catch (e) {
              console.warn(`[ExplorationStore] Lazy geocoding failed for cell ${cell.index}:`, e);
            }

            // Pause de 2 secondes pour respecter les limites du géocodeur natif
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
          console.log('[ExplorationStore] Géocodage différé terminé.');
        })().catch((err) =>
          console.error('[ExplorationStore] Error in lazy geocoding background worker:', err)
        );
      },
    }))
  );

export const useExplorationStore = createStore();

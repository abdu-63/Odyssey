import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';

// ─── H3 ───────────────────────────────────────────────────────────────────────

/** Un index H3 est une chaîne hexadécimale identifiant une cellule unique. */
export type H3Index = string;

// ─── Exploration ──────────────────────────────────────────────────────────────

/** Une cellule H3 découverte avec ses métadonnées de capture. */
export interface ExploredCell {
  /** Index H3 (résolution 10). */
  index: H3Index;
  /** Timestamp Unix en millisecondes de la découverte. */
  discoveredAt: number;
  /** Latitude du point GPS qui a déclenché la découverte. */
  lat: number;
  /** Longitude du point GPS qui a déclenché la découverte. */
  lng: number;
  /** Pays de la cellule. */
  country?: string | null;
  /** Ville ou commune de la cellule. */
  city?: string | null;
}

/** État du store Zustand d'exploration. */
export interface ExplorationState {
  /** Ensemble de tous les index H3 découverts (structure O(1) pour les lookups). */
  exploredCells: Set<H3Index>;
  /** Dictionnaire complet des cellules avec coordonnées et géocodage. */
  exploredCellsDetails: Map<H3Index, ExploredCell>;
  /**
   * GeoJSON pré-calculé des polygones fusionnés via Turf.
   * null = cache invalidé, doit être recalculé avant le prochain rendu Mapbox.
   */
  mergedGeoJSON: FeatureCollection<Polygon | MultiPolygon> | null;
  /** Timestamp de la dernière modification du Set exploredCells. */
  lastUpdatedAt: number | null;
  /** true pendant le chargement initial depuis SQLite. */
  isLoading: boolean;

  // ── Actions ──
  /** Ajoute un seul index H3 (depuis le background task). */
  addCell: (index: H3Index, lat: number, lng: number) => void;
  /** Charge en masse les cellules depuis la base de données au démarrage. */
  loadFromDatabase: (cells: ExploredCell[]) => void;
  /** Invalide le cache GeoJSON (déclenche un recalcul au prochain rendu). */
  invalidateGeoJSON: () => void;
  /** Recalcule et met en cache le GeoJSON fusionné. Opération coûteuse. */
  rebuildGeoJSON: () => void;
}

// ─── Statistiques ─────────────────────────────────────────────────────────────

export interface ExplorationStats {
  /** Nombre total de cellules H3 découvertes. */
  totalCells: number;
  /** Surface totale explorée en km². */
  totalAreaKm2: number;
  /** Distance totale estimée parcourue en km. */
  estimatedDistanceKm: number;
  /** Pourcentage de la surface terrestre explorée. */
  worldPercentage: number;
  /** Nombre de sessions de tracking effectuées. */
  sessionCount: number;
  /** Liste des pays explorés. */
  countriesExplored: { country: string; cellCount: number }[];
  /** Liste des villes explorées. */
  citiesExplored: { city: string; cellCount: number }[];
  /** Historique quotidien (date format YYYY-MM-DD -> nb de cellules). */
  dailyHistory: { date: string; cellCount: number }[];
}

// ─── Localisation ─────────────────────────────────────────────────────────────

/** Un point GPS capturé par le background task ou le foreground tracking. */
export interface LocationPoint {
  lat: number;
  lng: number;
  /** Précision horizontale estimée en mètres (95% confidence). */
  accuracy: number;
  /** Timestamp Unix en millisecondes. */
  timestamp: number;
  altitude?: number;
  /** Vitesse en m/s, peut être null si non disponible. */
  speed?: number | null;
}

/** Données reçues par la tâche expo-task-manager. */
export interface BackgroundTaskData {
  locations: LocationPoint[];
}

// ─── Tracking ─────────────────────────────────────────────────────────────────

export type TrackingStatus = 'idle' | 'starting' | 'active' | 'paused' | 'error';

export interface TrackingState {
  status: TrackingStatus;
  lastKnownPosition: LocationPoint | null;
  errorMessage: string | null;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export type AchievementId =
  | 'first_step'           // Premier hexagone découvert
  | 'explorer_10'          // 10 hexagones
  | 'explorer_100'         // 100 hexagones
  | 'explorer_500'         // 500 hexagones
  | 'explorer_1000'        // 1 000 hexagones
  | 'explorer_5000'        // 5 000 hexagones
  | 'explorer_10000'       // 10 000 hexagones
  | 'sprinter_10km'        // 10 km parcourus
  | 'marathon'             // 42 km parcourus
  | 'grand_voyageur_50km'  // 50 km parcourus
  | 'night_owl'            // Exploration entre 22h et 5h
  | 'early_bird'           // Exploration entre 5h et 7h
  | 'insomniac'            // Exploration entre minuit et 3h
  | 'lunch_walk'           // Exploration entre 12h et 14h
  | 'globetrotter'         // 2 pays ou plus
  | 'local_explorer';      // 3 villes ou plus

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  /** Nom d'icône Ionicons. */
  icon: string;
  /** Timestamp Unix (ms) de déblocage. null = verrouillé. */
  unlockedAt: number | null;
}

export interface AchievementsState {
  achievements: Record<AchievementId, Achievement>;
  /** Vérifie les conditions et débloque les succès applicables. Retourne les IDs débloqués. */
  checkAndUnlock: (stats: ExplorationStats, cells: Set<H3Index>) => AchievementId[];
  /** Charge l'état des achievements depuis AsyncStorage. */
  loadFromStorage: () => Promise<void>;
  /** Persiste l'état des achievements dans AsyncStorage. */
  saveToStorage: () => Promise<void>;
}

// ─── Database ─────────────────────────────────────────────────────────────────

/** Ligne brute telle que stockée dans SQLite. */
export interface DBCellRow {
  h3_index: string;
  discovered_at: number;
  lat: number;
  lng: number;
}

import { create } from 'zustand';
import type { ExplorationStats, ExploredCell } from '@/types';
import { H3_CELL_AREA_KM2_RES10, H3_TOTAL_CELLS_RES10 } from '@/utils/constants';
import { useExplorationStore } from './explorationStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsStoreState {
  stats: ExplorationStats;
  /** Recalcule les stats depuis l'état courant du store d'exploration. */
  recompute: () => void;
}

// ─── Calculs ──────────────────────────────────────────────────────────────────

function computeStats(cells: ExploredCell[]): ExplorationStats {
  const cellCount = cells.length;
  const totalAreaKm2 = cellCount * H3_CELL_AREA_KM2_RES10;
  // Distance estimée : on approxime que chaque cellule nouvelle nécessite ~65m de marche
  const estimatedDistanceKm = (cellCount * 65) / 1000;
  const worldPercentage = (cellCount / H3_TOTAL_CELLS_RES10) * 100;

  // Groupement par Pays et Villes
  const countryMap = new Map<string, number>();
  const cityMap = new Map<string, number>();
  // Groupement par Jour
  const dailyMap = new Map<string, number>();

  for (const cell of cells) {
    // Pays
    const country = cell.country || 'Non géocodé';
    countryMap.set(country, (countryMap.get(country) || 0) + 1);

    // Ville
    const city = cell.city || 'Non géocodé';
    cityMap.set(city, (cityMap.get(city) || 0) + 1);

    // Journée (locale)
    const dateObj = new Date(cell.discoveredAt);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
  }

  const countriesExplored = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, cellCount: count }))
    .sort((a, b) => b.cellCount - a.cellCount);

  const citiesExplored = Array.from(cityMap.entries())
    .map(([city, count]) => ({ city, cellCount: count }))
    .sort((a, b) => b.cellCount - a.cellCount);

  const dailyHistory = Array.from(dailyMap.entries())
    .map(([date, cellCount]) => ({ date, cellCount }))
    .sort((a, b) => b.date.localeCompare(a.date)); // Du plus récent au plus ancien

  return {
    totalCells: cellCount,
    totalAreaKm2,
    estimatedDistanceKm,
    worldPercentage,
    sessionCount: 0,
    countriesExplored,
    citiesExplored,
    dailyHistory,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStatsStore = create<StatsStoreState>()((set) => ({
  stats: computeStats([]),

  recompute: () => {
    const { exploredCellsDetails } = useExplorationStore.getState();
    set({ stats: computeStats(Array.from(exploredCellsDetails.values())) });
  },
}));

// ─── Synchronisation automatique ─────────────────────────────────────────────
// Recalcule les stats dès que le dictionnaire d'exploration change (y compris le géocodage différé).

useExplorationStore.subscribe(
  (state) => state.exploredCellsDetails,
  () => {
    useStatsStore.getState().recompute();
  }
);

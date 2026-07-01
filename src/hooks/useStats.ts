import { useStatsStore } from '@/store/statsStore';
import type { ExplorationStats } from '@/types';
import { H3_CELL_AREA_KM2_RES10 } from '@/utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseStatsReturn {
  stats: ExplorationStats;
  /** Surface explorée formatée pour l'affichage. */
  formattedArea: string;
  /** Distance estimée formatée pour l'affichage. */
  formattedDistance: string;
  /** Pourcentage mondial formaté pour l'affichage (très petit nombre !). */
  formattedWorldPercentage: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook de statistiques d'exploration.
 * Les stats sont automatiquement recalculées quand exploredCells change
 * (grâce à la subscription dans statsStore).
 */
export function useStats(): UseStatsReturn {
  const stats = useStatsStore((s) => s.stats);

  const formattedArea =
    stats.totalAreaKm2 >= 1
      ? `${stats.totalAreaKm2.toFixed(2)} km²`
      : `${(stats.totalAreaKm2 * 1_000_000).toFixed(0)} m²`;

  const formattedDistance =
    stats.estimatedDistanceKm >= 1
      ? `${stats.estimatedDistanceKm.toFixed(1)} km`
      : `${(stats.estimatedDistanceKm * 1000).toFixed(0)} m`;

  // Le % mondial est minuscule (ex: 0.0000001%) — 10 décimales pour afficher quelque chose
  const formattedWorldPercentage =
    stats.worldPercentage > 0
      ? `${stats.worldPercentage.toExponential(2)}%`
      : '0%';

  return {
    stats,
    formattedArea,
    formattedDistance,
    formattedWorldPercentage,
  };
}

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAchievementsStore } from '@/store/achievementsStore';
import { useStatsStore } from '@/store/statsStore';
import { useExplorationStore } from '@/store/explorationStore';
import type { Achievement, AchievementId } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseAchievementsReturn {
  achievements: Achievement[];
  /** Achievements débloqués (triés par date décroissante). */
  unlockedAchievements: Achievement[];
  /** Total débloqué. */
  unlockedCount: number;
  /** Achievement fraîchement débloqué à afficher dans un toast (null sinon). */
  latestUnlock: Achievement | null;
  /** Efface le toast du dernier déblocage. */
  dismissToast: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook de gestion des succès.
 *
 * - Charge les achievements persistés au premier montage.
 * - Vérifie les conditions à chaque changement de stats ou de cellules.
 * - Expose `latestUnlock` pour déclencher un toast de célébration.
 */
export function useAchievements(): UseAchievementsReturn {
  const { achievements, checkAndUnlock, loadFromStorage } = useAchievementsStore();
  const stats        = useStatsStore((s) => s.stats);
  const exploredCells = useExplorationStore((s) => s.exploredCells);

  const [latestUnlock, setLatestUnlock] = useState<Achievement | null>(null);
  const hasLoaded = useRef(false);

  // Chargement initial depuis SQLite
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadFromStorage();
  }, [loadFromStorage]);

  // Vérifie les déblocages à chaque changement de stats
  useEffect(() => {
    if (exploredCells.size === 0) return;

    const newlyUnlocked: AchievementId[] = checkAndUnlock(stats, exploredCells);
    if (newlyUnlocked.length > 0) {
      // Affiche le toast pour le premier achievement débloqué
      const freshAchievement = achievements[newlyUnlocked[0]];
      if (freshAchievement) {
        setLatestUnlock(freshAchievement);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.totalCells, stats.estimatedDistanceKm, stats.countriesExplored.length, stats.citiesExplored.length]);

  const dismissToast = useCallback(() => setLatestUnlock(null), []);

  const achievementList = Object.values(achievements);
  const unlockedAchievements = achievementList
    .filter((a) => a.unlockedAt !== null)
    .sort((a, b) => (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0));

  return {
    achievements: achievementList,
    unlockedAchievements,
    unlockedCount: unlockedAchievements.length,
    latestUnlock,
    dismissToast,
  };
}

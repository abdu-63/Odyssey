import { create } from 'zustand';
import type { Achievement, AchievementId, AchievementsState, ExplorationStats } from '@/types';
import type { H3Index } from '@/types';
import { ACHIEVEMENT_THRESHOLDS } from '@/utils/constants';
import { getDatabase } from '@/database/db';

// ─── Définitions statiques des succès ─────────────────────────────────────────

const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlockedAt'>[] = [
  {
    id: 'first_step',
    title: 'Premier pas',
    description: 'Découvre ton premier hexagone.',
    icon: 'footsteps-outline',
  },
  {
    id: 'explorer_10',
    title: 'Explorateur',
    description: `Découvre ${ACHIEVEMENT_THRESHOLDS.CELLS_10} hexagones.`,
    icon: 'compass-outline',
  },
  {
    id: 'explorer_100',
    title: 'Aventurier',
    description: `Découvre ${ACHIEVEMENT_THRESHOLDS.CELLS_100} hexagones.`,
    icon: 'map-outline',
  },
  {
    id: 'explorer_500',
    title: 'Cartographe chevronné',
    description: `Découvre ${ACHIEVEMENT_THRESHOLDS.CELLS_500} hexagones.`,
    icon: 'map-outline',
  },
  {
    id: 'explorer_1000',
    title: 'Cartographe',
    description: `Découvre ${ACHIEVEMENT_THRESHOLDS.CELLS_1K.toLocaleString('fr-FR')} hexagones.`,
    icon: 'earth-outline',
  },
  {
    id: 'explorer_5000',
    title: 'Grand explorateur',
    description: `Découvre ${ACHIEVEMENT_THRESHOLDS.CELLS_5K.toLocaleString('fr-FR')} hexagones.`,
    icon: 'ribbon-outline',
  },
  {
    id: 'explorer_10000',
    title: 'Grand Conquérant',
    description: `Découvre ${ACHIEVEMENT_THRESHOLDS.CELLS_10K.toLocaleString('fr-FR')} hexagones.`,
    icon: 'planet-outline',
  },
  {
    id: 'sprinter_10km',
    title: 'Sprinter',
    description: `Parcours ${ACHIEVEMENT_THRESHOLDS.KM_10} km au total.`,
    icon: 'walk-outline',
  },
  {
    id: 'marathon',
    title: 'Marathonien',
    description: `Parcours ${ACHIEVEMENT_THRESHOLDS.KM_42} km au total.`,
    icon: 'trail-sign-outline',
  },
  {
    id: 'grand_voyageur_50km',
    title: 'Grand Voyageur',
    description: `Parcours ${ACHIEVEMENT_THRESHOLDS.KM_50} km au total.`,
    icon: 'trophy-outline',
  },
  {
    id: 'night_owl',
    title: 'Oiseau de nuit',
    description: 'Explore entre 22h et 5h du matin.',
    icon: 'moon-outline',
  },
  {
    id: 'early_bird',
    title: 'Lève-tôt',
    description: 'Explore entre 5h et 7h du matin.',
    icon: 'sunny-outline',
  },
  {
    id: 'insomniac',
    title: 'Insomniaque',
    description: 'Explore entre minuit et 3h du matin.',
    icon: 'flash-outline',
  },
  {
    id: 'lunch_walk',
    title: 'Balade digestive',
    description: 'Explore entre 12h et 14h.',
    icon: 'restaurant-outline',
  },
  {
    id: 'globetrotter',
    title: 'Globe-trotteur',
    description: 'Explore au moins 2 pays différents.',
    icon: 'airplane-outline',
  },
  {
    id: 'local_explorer',
    title: 'Pilier de quartier',
    description: 'Explore au moins 3 villes différentes.',
    icon: 'business-outline',
  },
];

/** Crée la map initiale des achievements avec tous verrouillés. */
function buildInitialAchievements(): Record<AchievementId, Achievement> {
  return Object.fromEntries(
    ACHIEVEMENT_DEFS.map((def) => [
      def.id,
      { ...def, unlockedAt: null } satisfies Achievement,
    ])
  ) as Record<AchievementId, Achievement>;
}

/** Vérifie si l'heure actuelle tombe dans un créneau donné. */
function isCurrentHourBetween(from: number, to: number): boolean {
  const hour = new Date().getHours();
  if (from <= to) return hour >= from && hour < to;
  return hour >= from || hour < to; // Créneau traversant minuit
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAchievementsStore = create<AchievementsState>()((set, get) => ({
  achievements: buildInitialAchievements(),

  checkAndUnlock: (stats: ExplorationStats, cells: Set<H3Index>): AchievementId[] => {
    const { achievements } = get();
    const now = Date.now();
    const newlyUnlocked: AchievementId[] = [];

    const conditions: Record<AchievementId, () => boolean> = {
      first_step:          () => cells.size >= 1,
      explorer_10:         () => cells.size >= ACHIEVEMENT_THRESHOLDS.CELLS_10,
      explorer_100:        () => cells.size >= ACHIEVEMENT_THRESHOLDS.CELLS_100,
      explorer_500:        () => cells.size >= ACHIEVEMENT_THRESHOLDS.CELLS_500,
      explorer_1000:       () => cells.size >= ACHIEVEMENT_THRESHOLDS.CELLS_1K,
      explorer_5000:       () => cells.size >= ACHIEVEMENT_THRESHOLDS.CELLS_5K,
      explorer_10000:      () => cells.size >= ACHIEVEMENT_THRESHOLDS.CELLS_10K,
      sprinter_10km:       () => stats.estimatedDistanceKm >= ACHIEVEMENT_THRESHOLDS.KM_10,
      marathon:            () => stats.estimatedDistanceKm >= ACHIEVEMENT_THRESHOLDS.KM_42,
      grand_voyageur_50km: () => stats.estimatedDistanceKm >= ACHIEVEMENT_THRESHOLDS.KM_50,
      night_owl:           () => isCurrentHourBetween(22, 5),
      early_bird:          () => isCurrentHourBetween(5, 7),
      insomniac:           () => isCurrentHourBetween(0, 3),
      lunch_walk:          () => isCurrentHourBetween(12, 14),
      globetrotter:        () => stats.countriesExplored.filter(c => c.country !== 'Non géocodé' && c.country !== 'Inconnu').length >= 2,
      local_explorer:      () => stats.citiesExplored.filter(c => c.city !== 'Non géocodé' && c.city !== 'Inconnu').length >= 3,
    };

    const updated = { ...achievements };
    for (const id of Object.keys(conditions) as AchievementId[]) {
      if (!updated[id].unlockedAt && conditions[id]()) {
        updated[id] = { ...updated[id], unlockedAt: now };
        newlyUnlocked.push(id);
      }
    }

    if (newlyUnlocked.length > 0) {
      set({ achievements: updated });
      // Persistance asynchrone en SQLite
      persistAchievements(newlyUnlocked, now);
    }

    return newlyUnlocked;
  },

  loadFromStorage: async () => {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<{ id: string; unlocked_at: number }>(
        'SELECT id, unlocked_at FROM achievements'
      );
      if (rows.length === 0) return;

      const current = get().achievements;
      const updated = { ...current };
      for (const row of rows) {
        const id = row.id as AchievementId;
        if (id in updated) {
          updated[id] = { ...updated[id], unlockedAt: row.unlocked_at };
        }
      }
      set({ achievements: updated });
    } catch (err) {
      console.error('[AchievementsStore] loadFromStorage error:', err);
    }
  },

  saveToStorage: async () => {
    // Délégué à persistAchievements lors du déverrouillage
  },
}));

async function persistAchievements(ids: AchievementId[], unlockedAt: number) {
  try {
    const db = getDatabase();
    await db.withTransactionAsync(async () => {
      for (const id of ids) {
        await db.runAsync(
          'INSERT OR IGNORE INTO achievements (id, unlocked_at) VALUES (?, ?)',
          [id, unlockedAt]
        );
      }
    });
  } catch (err) {
    console.error('[AchievementsStore] persistAchievements error:', err);
  }
}

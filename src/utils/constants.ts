// ─── H3 Geospatial ────────────────────────────────────────────────────────────

/**
 * Métriques des résolutions H3 supportées pour le Fog of War.
 * Résolution 10 : ~15 000 m² par hexagone, rayon moyen ~65 m.
 * Résolution 9 : ~105 000 m² par hexagone, rayon moyen ~191 m.
 * Résolution 8 : ~737 000 m² par hexagone, rayon moyen ~505 m.
 */
export const H3_RESOLUTION_METRICS: Record<number, {
  areaKm2: number;
  totalCells: number;
  estimatedDistanceMeters: number;
  label: string;
  description: string;
}> = {
  10: {
    areaKm2: 0.0150474,
    totalCells: 33_782_160_994,
    estimatedDistanceMeters: 65,
    label: 'Petit',
    description: 'Rayon ~65m, idéal pour l\'exploration à pied'
  },
  9: {
    areaKm2: 0.1053075,
    totalCells: 4_826_022_994,
    estimatedDistanceMeters: 191,
    label: 'Moyen',
    description: 'Rayon ~191m, équilibre marche / vélo'
  },
  8: {
    areaKm2: 0.7371527,
    totalCells: 689_431_854,
    estimatedDistanceMeters: 505,
    label: 'Grand',
    description: 'Rayon ~505m, idéal pour le vélo ou la voiture'
  }
};

/**
 * Distance minimale (en mètres) entre deux positions GPS consécutives
 * pour déclencher une mise à jour. Filtre le bruit GPS à l'arrêt.
 */
export const MIN_DISTANCE_METERS = 20;

/**
 * Intervalle minimum entre deux mises à jour GPS en arrière-plan (ms).
 * 5 secondes = bon équilibre autonomie / précision au pas.
 */
export const LOCATION_INTERVAL_MS = 5_000;

/**
 * Seuil de précision GPS (en mètres) en dessous duquel on ignore le point.
 * Évite d'enregistrer des positions incertaines (ex: GPS dégradé en intérieur).
 */
export const MIN_GPS_ACCURACY_METERS = 50;

// ─── Background Task ──────────────────────────────────────────────────────────

/** Nom unique de la tâche expo-task-manager pour le tracking GPS en arrière-plan. */
export const BACKGROUND_LOCATION_TASK = 'EXPLORE_MAP_BACKGROUND_LOCATION';

// ─── Mapbox Layer IDs ─────────────────────────────────────────────────────────

/** Identifiant de la source GeoJSON (hexagones explorés fusionnés). */
export const EXPLORED_SOURCE_ID = 'explored-hexagons-source';

/** Calque de remplissage des zones explorées (transparent, "perce" le fog). */
export const EXPLORED_FILL_LAYER_ID = 'explored-hexagons-fill';

/** Calque de bordure des hexagones explorés. */
export const EXPLORED_LINE_LAYER_ID = 'explored-hexagons-line';

/** Calque du voile d'obscurité couvrant toute la carte. */
export const FOG_FILL_LAYER_ID = 'fog-overlay-fill';

// ─── Design System ────────────────────────────────────────────────────────────

export const COLORS = {
  // Backgrounds
  background:      '#0D0D0D',
  surface:         '#1A1A1A',
  surfaceElevated: '#252525',
  border:          '#2A2A2A',

  // Accent (couleur des hexagones découverts et éléments actifs)
  accent:          '#4FC3F7', // Bleu clair néon
  accentDim:       '#1B6E8F',
  accentMuted:     'rgba(79, 195, 247, 0.15)',

  // Fog overlay
  fogColor:        'rgba(0, 0, 0, 0.80)',

  // Hexagones (rendu Mapbox)
  hexFill:         'rgba(79, 195, 247, 0.18)',  // Transparent, perce le fog
  hexBorder:       'rgba(79, 195, 247, 0.55)',

  // Texte
  textPrimary:     '#F0F0F0',
  textSecondary:   '#888888',
  textMuted:       '#555555',

  // États
  success:         '#4CAF50',
  warning:         '#FF9800',
  error:           '#F44336',
} as const;

// ─── Statistiques ─────────────────────────────────────────────────────────────
// Les statistiques sont désormais calculées dynamiquement à l'aide de H3_RESOLUTION_METRICS.

// ─── Achievements ─────────────────────────────────────────────────────────────

/** Seuils de déblocage en nombre d'hexagones pour les succès d'exploration. */
export const ACHIEVEMENT_THRESHOLDS = {
  CELLS_10:    10,
  CELLS_100:   100,
  CELLS_500:   500,
  CELLS_1K:    1_000,
  CELLS_5K:    5_000,
  CELLS_10K:   10_000,
  KM_10:       10,
  KM_42:       42,
  KM_50:       50,
} as const;

// ─── UI ───────────────────────────────────────────────────────────────────────

/** Durée d'affichage d'un toast d'achievement (ms). */
export const ACHIEVEMENT_TOAST_DURATION_MS = 4_000;

/** Nombre max d'hexagones avant d'afficher un warning de performance. */
export const PERF_WARNING_CELLS_THRESHOLD = 50_000;

// ─── Thèmes du Brouillard ─────────────────────────────────────────────────────

export type FogThemeId = 'classic' | 'neon_green' | 'radioactive_purple' | 'polar_blue' | 'sepia';

export interface FogTheme {
  id: FogThemeId;
  name: string;
  fogColor: string;
  accentColor: string;
}

export const FOG_THEMES: Record<FogThemeId, FogTheme> = {
  classic: {
    id: 'classic',
    name: 'Classique (Sombre)',
    fogColor: 'rgba(0, 0, 0, 0.82)',
    accentColor: '#4FC3F7',
  },
  neon_green: {
    id: 'neon_green',
    name: 'Vert Néon',
    fogColor: 'rgba(0, 15, 5, 0.85)',
    accentColor: '#2ECC71',
  },
  radioactive_purple: {
    id: 'radioactive_purple',
    name: 'Violet Radioactif',
    fogColor: 'rgba(15, 0, 25, 0.85)',
    accentColor: '#9B59B6',
  },
  polar_blue: {
    id: 'polar_blue',
    name: 'Bleu Polaire',
    fogColor: 'rgba(0, 10, 20, 0.85)',
    accentColor: '#1ABC9C',
  },
  sepia: {
    id: 'sepia',
    name: 'Rétro Sépia',
    fogColor: 'rgba(25, 20, 10, 0.82)',
    accentColor: '#E67E22',
  },
};

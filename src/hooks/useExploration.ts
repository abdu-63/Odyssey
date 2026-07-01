import { useEffect, useRef, useCallback } from 'react';
import { useExplorationStore } from '@/store/explorationStore';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

// ─── Types retournés ──────────────────────────────────────────────────────────

export interface UseExplorationReturn {
  /** Nombre d'hexagones explorés. */
  cellCount: number;
  /** Polygone de brouillard prêt pour Mapbox (toujours non-null). */
  fogPolygon: Feature<Polygon | MultiPolygon>;
  /** true pendant le chargement initial depuis SQLite. */
  isLoading: boolean;
  /** Timestamp ISO de la dernière découverte (ou null). */
  lastDiscoveryAt: string | null;
  /** Déclenche le rechargement depuis la base de données. */
  reload: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook principal pour accéder aux données d'exploration depuis les composants.
 *
 * Charge automatiquement les données SQLite au premier montage.
 * Retourne le fogPolygon prêt à être passé à Mapbox ShapeSource.
 */
export function useExploration(): UseExplorationReturn {
  const loadFromDatabase = useExplorationStore((s) => s.loadFromDatabase);
  const exploredCells    = useExplorationStore((s) => s.exploredCells);
  const fogPolygon       = useExplorationStore((s) => s.fogPolygon);
  const isLoading        = useExplorationStore((s) => s.isLoading);
  const lastUpdatedAt    = useExplorationStore((s) => s.lastUpdatedAt);

  // Chargement initial au montage (une seule fois)
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadFromDatabase();
  }, [loadFromDatabase]);

  const reload = useCallback(async () => {
    await loadFromDatabase();
  }, [loadFromDatabase]);

  const lastDiscoveryAt = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString('fr-FR')
    : null;

  return {
    cellCount: exploredCells.size,
    fogPolygon,
    isLoading,
    lastDiscoveryAt,
    reload,
  };
}

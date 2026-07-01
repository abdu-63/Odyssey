/**
 * Utilitaires géospatiaux : conversion H3 → GeoJSON + fusion Turf.
 *
 * STRATÉGIE FOG OF WAR :
 * Au lieu de rendre N polygones hexagonaux individuels (crash à 10 000+),
 * on calcule UN SEUL polygone = rectangle monde - union des hexagones explorés.
 * Mapbox rend ainsi UNE feature avec des "trous" transparents, quelle que
 * soit la taille de la zone explorée.
 *
 * OPTIMISATION INCRÉMENTALE :
 * On conserve l'union explorée en cache et on la met à jour par delta
 * plutôt que de tout recalculer depuis zéro à chaque nouveau hexagone.
 */

import {
  polygon,
  union,
  difference,
  bboxPolygon,
  featureCollection,
} from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, FeatureCollection } from 'geojson';
import { getCellBoundaryGeoJSON } from '@/services/h3Service';
import type { H3Index } from '@/types';

// ─── Constantes ───────────────────────────────────────────────────────────────

/**
 * Rectangle couvrant tout le monde (limites Web Mercator).
 * Sert de "canevas" sur lequel on creuse des trous (zones explorées).
 */
export const WORLD_BBOX = bboxPolygon([-180, -85.051129, 180, 85.051129]) as Feature<Polygon>;

// ─── H3 → Polygone GeoJSON ───────────────────────────────────────────────────

/**
 * Convertit un index H3 en Feature<Polygon> GeoJSON.
 */
function h3ToPolygonFeature(index: H3Index): Feature<Polygon> {
  const coords = getCellBoundaryGeoJSON(index);
  const closed: [number, number][] = [...coords, coords[0]]; // Ferme l'anneau
  return polygon([closed]);
}

// ─── Fusion Turf (divide & conquer) ──────────────────────────────────────────

/**
 * Fusionne un tableau de polygones en un seul using Turf union.
 * Utilise une approche diviser-pour-régner pour de meilleures performances
 * (O(n log n) unions vs O(n) en séquentiel).
 *
 * Pour N > 5 000 cellules, envisager une approche asynchrone par lots.
 */
export function mergePolygons(
  features: Feature<Polygon | MultiPolygon>[]
): Feature<Polygon | MultiPolygon> | null {
  if (features.length === 0) return null;
  if (features.length === 1) return features[0];

  const nextLevel: Feature<Polygon | MultiPolygon>[] = [];
  for (let i = 0; i < features.length; i += 2) {
    if (i + 1 >= features.length) {
      nextLevel.push(features[i]);
    } else {
      const fc = featureCollection([
        features[i],
        features[i + 1],
      ]) as FeatureCollection<Polygon | MultiPolygon>;
      const merged = union(fc);
      nextLevel.push(merged ?? features[i]);
    }
  }

  return mergePolygons(nextLevel);
}

// ─── Calcul du brouillard ──────────────────────────────────────────────────────

/**
 * Calcule le polygone de brouillard = monde entier - zones explorées.
 * Le résultat est une Feature avec des "trous" aux endroits explorés.
 *
 * @param exploredUnion - Union fusionnée des hexagones explorés (ou null si aucun)
 * @returns Feature prête à rendre dans Mapbox (toujours non-null)
 */
export function computeFogPolygon(
  exploredUnion: Feature<Polygon | MultiPolygon> | null
): Feature<Polygon | MultiPolygon> {
  if (!exploredUnion) return WORLD_BBOX;

  const fc = featureCollection([
    WORLD_BBOX as Feature<Polygon | MultiPolygon>,
    exploredUnion,
  ]) as FeatureCollection<Polygon | MultiPolygon>;

  return difference(fc) ?? WORLD_BBOX;
}

/**
 * Calcule l'union de tous les hexagones depuis une liste d'index.
 * À utiliser pour le chargement initial depuis SQLite.
 *
 * @param cellIndices - Tous les index H3 explorés
 * @returns Union fusionnée, ou null si la liste est vide
 */
export function buildExploredUnion(
  cellIndices: H3Index[]
): Feature<Polygon | MultiPolygon> | null {
  if (cellIndices.length === 0) return null;
  const hexagonFeatures = cellIndices.map(h3ToPolygonFeature);
  return mergePolygons(hexagonFeatures);
}

/**
 * MISE À JOUR INCRÉMENTALE — beaucoup plus rapide que de tout recalculer.
 * Étend l'union existante avec seulement les nouveaux hexagones.
 *
 * @param existingUnion - L'union actuelle (peut être null)
 * @param newCellIndices - Les nouveaux index H3 à intégrer
 * @returns Nouveau exploredUnion et fogPolygon
 */
export function extendExploredUnion(
  existingUnion: Feature<Polygon | MultiPolygon> | null,
  newCellIndices: H3Index[]
): {
  exploredUnion: Feature<Polygon | MultiPolygon> | null;
  fogPolygon: Feature<Polygon | MultiPolygon>;
} {
  if (newCellIndices.length === 0) {
    return {
      exploredUnion: existingUnion,
      fogPolygon: computeFogPolygon(existingUnion),
    };
  }

  // Fusionne les nouveaux hexagones entre eux
  const newHexFeatures = newCellIndices.map(h3ToPolygonFeature);
  const newUnion = mergePolygons(newHexFeatures);

  // Étend l'union existante
  let updatedUnion: Feature<Polygon | MultiPolygon> | null;
  if (!existingUnion || !newUnion) {
    updatedUnion = newUnion ?? existingUnion;
  } else {
    const fc = featureCollection([
      existingUnion,
      newUnion,
    ]) as FeatureCollection<Polygon | MultiPolygon>;
    updatedUnion = union(fc) ?? existingUnion;
  }

  return {
    exploredUnion: updatedUnion,
    fogPolygon: computeFogPolygon(updatedUnion),
  };
}

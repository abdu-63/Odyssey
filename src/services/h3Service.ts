import { latLngToCell, cellToBoundary, gridDisk, cellToLatLng } from 'h3-js';
import { H3_RESOLUTION, MIN_GPS_ACCURACY_METERS } from '@/utils/constants';
import type { H3Index, LocationPoint } from '@/types';

/**
 * Convertit une coordonnée GPS en index H3 à la résolution configurée (10).
 */
export function coordsToH3(lat: number, lng: number): H3Index {
  return latLngToCell(lat, lng, H3_RESOLUTION);
}

/**
 * Convertit un objet LocationPoint en index H3.
 * Retourne null si la précision GPS est trop dégradée.
 */
export function locationToH3(location: LocationPoint): H3Index | null {
  if (location.accuracy > MIN_GPS_ACCURACY_METERS) return null;
  return coordsToH3(location.lat, location.lng);
}

/**
 * Retourne les limites d'une cellule H3 sous forme de paires [lng, lat].
 * Note : h3-js retourne [lat, lng] — on inverse pour respecter la convention GeoJSON.
 */
export function getCellBoundaryGeoJSON(index: H3Index): [number, number][] {
  const boundary = cellToBoundary(index); // [[lat, lng], ...]
  return boundary.map(([lat, lng]) => [lng, lat] as [number, number]);
}

/**
 * Retourne le centre d'une cellule H3 sous forme [lat, lng].
 */
export function getCellCenter(index: H3Index): [number, number] {
  return cellToLatLng(index); // [lat, lng]
}

/**
 * Retourne les cellules H3 dans un rayon de k anneaux autour d'un index central.
 * k=0 → juste la cellule elle-même
 * k=1 → la cellule + ses 6 voisins immédiats
 */
export function getCellsInDisk(index: H3Index, k: number): H3Index[] {
  return gridDisk(index, k);
}

/**
 * Filtre une liste de candidats pour ne garder que les index non encore explorés.
 */
export function filterNewCells(
  candidates: H3Index[],
  exploredSet: ReadonlySet<H3Index>
): H3Index[] {
  return candidates.filter((idx) => !exploredSet.has(idx));
}

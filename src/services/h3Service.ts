import { latLngToCell, cellToBoundary, gridDisk, cellToLatLng, getResolution, cellToParent } from 'h3-js';
import { MIN_GPS_ACCURACY_METERS } from '@/utils/constants';
import type { H3Index, LocationPoint } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Convertit une coordonnée GPS en index H3 à la résolution active.
 */
export function coordsToH3(lat: number, lng: number): H3Index {
  const resolution = useSettingsStore.getState().h3Resolution;
  return latLngToCell(lat, lng, resolution);
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

/**
 * Retourne la résolution d'un index H3.
 */
export function getCellResolution(index: H3Index): number {
  return getResolution(index);
}

/**
 * Migre un index H3 d'une ancienne résolution vers la résolution active.
 * Si l'ancienne résolution est plus fine (ex: 10) que la résolution cible (ex: 9),
 * retourne le parent à la résolution cible.
 */
export function migrateCellToCurrentResolution(index: H3Index): H3Index {
  const targetResolution = useSettingsStore.getState().h3Resolution;
  const currentResolution = getResolution(index);

  if (currentResolution === targetResolution) {
    return index;
  }

  if (currentResolution > targetResolution) {
    return cellToParent(index, targetResolution);
  }

  return index;
}

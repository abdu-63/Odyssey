/**
 * Définition de la tâche expo-task-manager pour le tracking GPS en arrière-plan.
 *
 * ⚠️ RÈGLE EXPO : Ce module DOIT être importé (comme side-effect) au plus
 * tôt dans l'arborescence de l'app, AVANT le premier appel à
 * Location.startLocationUpdatesAsync(). On l'importe dans app/_layout.tsx.
 *
 * Note d'architecture : La tâche s'exécute dans le même contexte JS que
 * l'app principale sur iOS/Android. Elle peut donc accéder directement
 * au store Zustand via .getState(), sans pont inter-process.
 */

import * as TaskManager from 'expo-task-manager';
import type { LocationObject } from 'expo-location';
import { BACKGROUND_LOCATION_TASK, MIN_GPS_ACCURACY_METERS } from '@/utils/constants';
import { coordsToH3 } from './h3Service';
import { useExplorationStore } from '@/store/explorationStore';

// ─── Type des données reçues par la tâche ─────────────────────────────────────

interface BackgroundLocationData {
  locations: LocationObject[];
}

// ─── Définition de la tâche ───────────────────────────────────────────────────

TaskManager.defineTask<BackgroundLocationData>(
  BACKGROUND_LOCATION_TASK,
  async ({ data, error }) => {
    if (error) {
      // Code 0 (kCLErrorLocationUnknown) est une erreur temporaire normale le temps d'acquérir le signal GPS.
      // On évite de polluer la console avec une erreur bloquante.
      if (error.message.includes('Code=0') || error.message.includes('locationUnknown')) {
        return;
      }
      console.error('[BackgroundTask] Erreur de localisation:', error.message);
      return;
    }

    if (!data?.locations?.length) return;

    // Accès au store Zustand via l'API statique (hors contexte React)
    const { exploredCells, addCell } = useExplorationStore.getState();

    for (const location of data.locations) {
      const { latitude, longitude, accuracy } = location.coords;

      // Filtre les positions avec une précision trop faible
      if (accuracy !== null && accuracy > MIN_GPS_ACCURACY_METERS) {
        continue;
      }

      // Conversion GPS → index H3 résolution 10
      const h3Index = coordsToH3(latitude, longitude);

      // Déduplication : n'ajoute que si l'index est vraiment nouveau
      if (!exploredCells.has(h3Index)) {
        addCell(h3Index, latitude, longitude);
      }
    }
  }
);

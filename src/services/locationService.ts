import * as Location from 'expo-location';
import { BACKGROUND_LOCATION_TASK, LOCATION_INTERVAL_MS, MIN_DISTANCE_METERS } from '@/utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PermissionResult =
  | { granted: true }
  | { granted: false; reason: 'denied' | 'blocked' | 'unavailable' };

// ─── Permissions ──────────────────────────────────────────────────────────────

/**
 * Demande les permissions de localisation dans le bon ordre pour iOS/Android.
 *
 * Sur iOS : on doit d'abord demander WhenInUse, puis Always dans une
 * seconde étape (iOS refusera de demander Always directement).
 */
export async function requestLocationPermissions(): Promise<PermissionResult> {
  // Étape 1 : Permission "Quand l'app est utilisée" (obligatoire avant "Toujours")
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();

  if (foregroundStatus !== 'granted') {
    return { granted: false, reason: 'denied' };
  }

  // Étape 2 : Permission "Toujours" (nécessaire pour le background tracking)
  const { status: backgroundStatus } =
    await Location.requestBackgroundPermissionsAsync();

  if (backgroundStatus !== 'granted') {
    // On peut quand même tracker en foreground, mais pas en arrière-plan
    console.warn('[LocationService] Permission background non accordée — tracking foreground uniquement.');
    return { granted: false, reason: 'denied' };
  }

  return { granted: true };
}

/**
 * Vérifie les permissions sans les demander.
 */
export async function checkLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  const fg = await Location.getForegroundPermissionsAsync();
  const bg = await Location.getBackgroundPermissionsAsync();
  return {
    foreground: fg.status === 'granted',
    background: bg.status === 'granted',
  };
}

// ─── Tracking en arrière-plan ─────────────────────────────────────────────────

/**
 * Démarre le tracking GPS en arrière-plan.
 * Pré-requis : les permissions doivent avoir été accordées.
 */
export async function startBackgroundTracking(): Promise<void> {
  const isAlreadyRunning = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK
  );

  if (isAlreadyRunning) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    // Haute précision GPS
    accuracy: Location.Accuracy.BestForNavigation,

    // Déclenche une mise à jour tous les MIN_DISTANCE_METERS mètres parcourus
    distanceInterval: MIN_DISTANCE_METERS,

    // Intervalle minimum entre deux mises à jour (ms)
    timeInterval: LOCATION_INTERVAL_MS,

    // iOS : affiche l'indicateur de localisation en arrière-plan (flèche bleue)
    showsBackgroundLocationIndicator: true,

    // iOS : ne pas pauser les mises à jour automatiquement
    pausesUpdatesAutomatically: false,

    // iOS : optimisé pour les activités de marche / fitness
    activityType: Location.ActivityType.Fitness,

    // iOS : pas de différé (mises à jour en temps réel)
    deferredUpdatesInterval: 0,
    deferredUpdatesDistance: 0,

    // Android : Foreground Service avec notification persistante
    // (requis pour le background location sur Android 8+)
    foregroundService: {
      notificationTitle: '🗺️ Explore Map',
      notificationBody: 'Exploration en cours — découverte de nouvelles zones…',
      notificationColor: '#4FC3F7',
    },
  });
}

/**
 * Arrête le tracking GPS en arrière-plan.
 */
export async function stopBackgroundTracking(): Promise<void> {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK
  );

  if (!isRunning) return;

  await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
}

/**
 * Retourne true si le tracking est actif.
 */
export async function isTrackingActive(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
}

/**
 * Retourne la dernière position connue (rapide, ne lance pas un nouveau fix GPS).
 */
export async function getLastKnownPosition(): Promise<Location.LocationObject | null> {
  return Location.getLastKnownPositionAsync({
    maxAge: 30_000, // Accepte une position vieille de max 30 secondes
    requiredAccuracy: 50,
  });
}

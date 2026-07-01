// app.config.js — Configuration Expo dynamique
// Utilise process.env pour injecter les tokens Mapbox sans les committer.
// Les variables sont lues depuis le fichier .env (chargé automatiquement par Expo CLI).

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'Odyssey',
  slug: 'odyssey',
  version: '1.0.0',
  orientation: 'portrait',
  // Requis par Expo Router pour le deep linking
  scheme: 'odyssey',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,

  icon: './assets/images/icon.png',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0D0D0D',
  },

  // ─── iOS ────────────────────────────────────────────────────────────────────
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.yourname.odyssey',
    infoPlist: {
      // Permission "Quand l'app est utilisée"
      NSLocationWhenInUseUsageDescription:
        'Odyssey utilise ta position pour dévoiler la carte autour de toi en temps réel.',
      // Permission "Toujours" — indispensable pour le tracking en arrière-plan
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Odyssey suit ta position en arrière-plan pour enregistrer ton exploration même quand l'application n'est pas visible.",
      NSLocationAlwaysUsageDescription:
        "Odyssey suit ta position en arrière-plan pour enregistrer ton exploration même quand l'application n'est pas visible.",
      // Déclare le mode background "location" — OBLIGATOIRE pour expo-task-manager
      UIBackgroundModes: ['location'],
    },
  },

  // ─── Android ────────────────────────────────────────────────────────────────
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0D0D0D',
    },
    package: 'com.yourname.odyssey',
    // Permissions déclarées dans AndroidManifest.xml
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      // Requis pour Android 10+ (API 29+) pour le background location
      'ACCESS_BACKGROUND_LOCATION',
      // Requis pour le foreground service (Android 9+ recommandé)
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
    ],
  },

  // ─── Web (désactivé) ────────────────────────────────────────────────────────
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  // ─── Plugins ────────────────────────────────────────────────────────────────
  plugins: [
    // Expo Router — doit être en premier
    'expo-router',

    // expo-location — configure automatiquement les permissions dans Info.plist / AndroidManifest
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          "Odyssey suit ta position en arrière-plan pour enregistrer ton exploration.",
        locationAlwaysPermission:
          "Odyssey suit ta position en arrière-plan pour enregistrer ton exploration.",
        locationWhenInUsePermission:
          'Odyssey utilise ta position pour dévoiler la carte autour de toi.',
        // Active le service en arrière-plan sur Android
        isAndroidBackgroundLocationEnabled: true,
        // Active le foreground service Android (notification persistante lors du tracking)
        isAndroidForegroundServiceEnabled: true,
      },
    ],

    // @rnmapbox/maps — configure CocoaPods (iOS) et Maven (Android) pour le SDK natif
    // RNMapboxMapsDownloadToken : secret token (sk.xxx) UNIQUEMENT pour le téléchargement
    // du SDK natif au moment du pod install / gradle build. NE PAS committer ce token.
    [
      '@rnmapbox/maps',
      {
        // Version du Mapbox Maps iOS SDK à utiliser (compatible avec @rnmapbox/maps ~10.2.x)
        RNMapboxMapsVersion: '~> 11.0',
      },
    ],

    // expo-build-properties — force les paramètres de build natifs
    [
      'expo-build-properties',
      {
        ios: {
          // CRITIQUE : iOS 15.1 minimum requis (cible de déploiement stricte)
          deploymentTarget: '15.1',
        },
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          // Android 7.0+ (API 24) — couvre 99%+ des appareils Android actifs
          minSdkVersion: 24,
        },
      },
    ],
  ],

  // ─── Extra (accessible via expo-constants dans le code) ──────────────────────
  extra: {
    // Token public Mapbox (pk.xxx) — injecté depuis EXPO_PUBLIC_MAPBOX_TOKEN dans .env
    // Accessible dans le code via process.env.EXPO_PUBLIC_MAPBOX_TOKEN
    mapboxPublicToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
    eas: {
      projectId: 'REPLACE_WITH_YOUR_EAS_PROJECT_ID',
    },
  },
};

module.exports = config;

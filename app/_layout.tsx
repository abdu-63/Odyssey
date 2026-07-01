import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Mapbox from '@rnmapbox/maps';
import { COLORS } from '@/utils/constants';
import { initDatabase } from '@/database/db';
import { useSettingsStore } from '@/store/settingsStore';

// Enregistre la tâche en arrière-plan au plus tôt
import '@/services/backgroundTask';

// Configuration du token public Mapbox
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

/**
 * Root layout — enveloppe toute l'application.
 */
export default function RootLayout() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    initDatabase()
      .then(() => loadSettings())
      .then(() => setDbInitialized(true))
      .catch(err => {
        console.error("Database init error:", err);
        // Fallback to true so the app does not remain blank on error
        setDbInitialized(true);
      });
  }, [loadSettings]);

  if (!dbInitialized) {
    return null; // A background matching COLORS.background is rendered implicitly by the container
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}

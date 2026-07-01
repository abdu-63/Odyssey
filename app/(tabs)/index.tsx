import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FogMap } from '@/components/map/FogMap';
import { HUD } from '@/components/hud/HUD';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementToast } from '@/components/achievements/AchievementToast';

export default function MapScreen() {
  const { latestUnlock, dismissToast } = useAchievements();

  return (
    <View style={styles.container}>
      <FogMap />
      <HUD />
      {latestUnlock && (
        <AchievementToast 
          achievement={latestUnlock} 
          onDismiss={dismissToast} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

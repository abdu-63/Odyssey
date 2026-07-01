import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, ACHIEVEMENT_TOAST_DURATION_MS } from '@/utils/constants';
import type { Achievement } from '@/types';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, ACHIEVEMENT_TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  return (
    <Animated.View 
      entering={FadeInUp.duration(400)} 
      exiting={FadeOutUp.duration(300)}
      style={styles.toastContainer}
    >
      <View style={styles.toast}>
        <Ionicons name="trophy" size={24} color={COLORS.accent} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Succès débloqué !</Text>
          <Text style={styles.name}>{achievement.title}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
});

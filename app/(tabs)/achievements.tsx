import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/utils/constants';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementCard } from '@/components/achievements/AchievementCard';

export default function AchievementsScreen() {
  const { achievements, unlockedCount } = useAchievements();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Succès</Text>
        <Text style={styles.subHeader}>
          {unlockedCount} / {achievements.length} débloqués
        </Text>

        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    gap: 10,
  },
  header: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subHeader: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});

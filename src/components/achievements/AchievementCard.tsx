import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/utils/constants';
import type { Achievement } from '@/types';

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { title, description, icon, unlockedAt } = achievement;
  const isUnlocked = unlockedAt !== null;

  return (
    <View style={[styles.card, !isUnlocked && styles.cardLocked]}>
      <View style={[styles.iconContainer, !isUnlocked && styles.iconLocked]}>
        <Ionicons
          name={icon as React.ComponentProps<typeof Ionicons>['name']}
          size={24}
          color={isUnlocked ? COLORS.accent : COLORS.textMuted}
        />
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, !isUnlocked && styles.textLocked]}>
          {title}
        </Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
      {isUnlocked && (
        <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLocked: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLocked: {
    backgroundColor: COLORS.surfaceElevated,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  textLocked: {
    color: COLORS.textSecondary,
  },
  cardDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});

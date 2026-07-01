import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '@/utils/constants';

interface StatsCardProps {
  emoji: string;
  value: string;
  label: string;
}

export function StatsCard({ emoji, value, label }: StatsCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardEmoji}>{emoji}</Text>
      <View style={styles.cardText}>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardEmoji: {
    fontSize: 32,
    color: COLORS.accent, // Force la coloration du symbole d'hexagone en bleu néon
    width: 40,
    textAlign: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardValue: {
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: '700',
  },
  cardLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});

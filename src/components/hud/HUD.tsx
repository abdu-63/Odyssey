import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useExploration } from '@/hooks/useExploration';
import { TrackingToggle } from './TrackingToggle';
import { COLORS } from '@/utils/constants';

export function HUD() {
  const { cellCount, isLoading } = useExploration();

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.topBar} pointerEvents="box-none">
        <View style={styles.statsBadge}>
          <Text style={styles.statsLabel}>HEXAGONES</Text>
          <Text style={styles.statsValue}>{isLoading ? '...' : cellCount}</Text>
        </View>
      </View>
      <View style={styles.bottomBar} pointerEvents="box-none">
        <TrackingToggle />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statsBadge: {
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statsLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  statsValue: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
});

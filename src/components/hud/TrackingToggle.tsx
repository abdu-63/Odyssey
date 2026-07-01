import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { startBackgroundTracking, stopBackgroundTracking, isTrackingActive, requestLocationPermissions } from '@/services/locationService';
import { COLORS } from '@/utils/constants';

export function TrackingToggle() {
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    isTrackingActive().then(setIsTracking);
  }, []);

  const toggleTracking = async () => {
    if (isTracking) {
      await stopBackgroundTracking();
      setIsTracking(false);
    } else {
      const { granted } = await requestLocationPermissions();
      if (granted) {
        await startBackgroundTracking();
        setIsTracking(true);
      } else {
        console.warn('Location permissions denied');
      }
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, isTracking ? styles.buttonActive : styles.buttonInactive]} 
      onPress={toggleTracking}
      activeOpacity={0.8}
    >
      <Ionicons 
        name={isTracking ? "pause" : "play"} 
        size={24} 
        color={isTracking ? COLORS.background : COLORS.textPrimary} 
      />
      <Text style={[styles.text, isTracking ? styles.textActive : styles.textInactive]}>
        {isTracking ? 'STOP' : 'START'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonInactive: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonActive: {
    backgroundColor: COLORS.accent,
  },
  text: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
  textInactive: {
    color: COLORS.textPrimary,
  },
  textActive: {
    color: COLORS.background,
  },
});

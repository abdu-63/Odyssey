import React from 'react';
import { Text, StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/utils/constants';
import { useStats } from '@/hooks/useStats';
import { StatsCard } from '@/components/stats/StatsCard';

export default function StatsScreen() {
  const { stats, formattedArea, formattedDistance, formattedWorldPercentage } = useStats();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Statistiques</Text>

        <StatsCard 
          emoji="⬡" 
          value={stats.totalCells.toString()} 
          label="Hexagones découverts" 
        />
        <StatsCard 
          emoji="📐" 
          value={formattedArea} 
          label="Surface explorée" 
        />
        <StatsCard 
          emoji="🌍" 
          value={formattedWorldPercentage} 
          label="Monde exploré" 
        />
        <StatsCard 
          emoji="🚶" 
          value={formattedDistance} 
          label="Distance estimée" 
        />

        {/* Section Territoires explorés */}
        <Text style={styles.sectionHeader}>🗺️ Territoires explorés</Text>
        
        <View style={styles.sectionCard}>
          <Text style={styles.subSectionHeader}>Pays</Text>
          {stats.countriesExplored.length === 0 ? (
            <Text style={styles.emptyText}>Aucun pays exploré pour le moment.</Text>
          ) : (
            stats.countriesExplored.map((c, i) => (
              <View key={c.country} style={[styles.listItem, i === stats.countriesExplored.length - 1 && styles.noBorder]}>
                <Text style={styles.listTextName}>{c.country}</Text>
                <Text style={styles.listTextValue}>
                  {c.cellCount} ⬡ <Text style={styles.listTextSubValue}>({(c.cellCount * 0.0150474).toFixed(2)} km²)</Text>
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.subSectionHeader}>Villes / Communes</Text>
          {stats.citiesExplored.length === 0 ? (
            <Text style={styles.emptyText}>Aucune ville explorée pour le moment.</Text>
          ) : (
            stats.citiesExplored.slice(0, 10).map((c, i) => (
              <View key={c.city} style={[styles.listItem, i === Math.min(10, stats.citiesExplored.length) - 1 && styles.noBorder]}>
                <Text style={styles.listTextName}>{c.city}</Text>
                <Text style={styles.listTextValue}>{c.cellCount} ⬡</Text>
              </View>
            ))
          )}
          {stats.citiesExplored.length > 10 && (
            <Text style={styles.moreText}>+ {stats.citiesExplored.length - 10} autres villes</Text>
          )}
        </View>

        {/* Section Historique Quotidien */}
        <Text style={styles.sectionHeader}>📅 Historique quotidien</Text>
        
        <View style={styles.sectionCard}>
          {stats.dailyHistory.length === 0 ? (
            <Text style={styles.emptyText}>Aucune activité enregistrée.</Text>
          ) : (
            stats.dailyHistory.slice(0, 7).map((h, i) => {
              const dateParts = h.date.split('-');
              const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
              const formattedDate = dateObj.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });
              
              return (
                <View key={h.date} style={[styles.listItem, i === Math.min(7, stats.dailyHistory.length) - 1 && styles.noBorder]}>
                  <Text style={styles.listTextName}>{formattedDate}</Text>
                  <Text style={styles.listTextValue}>
                    {h.cellCount} ⬡ <Text style={styles.listTextSubValue}>({(h.cellCount * 0.0150474).toFixed(3)} km²)</Text>
                  </Text>
                </View>
              );
            })
          )}
          {stats.dailyHistory.length > 7 && (
            <Text style={styles.moreText}>+ {stats.dailyHistory.length - 7} jours précédents</Text>
          )}
        </View>
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
    gap: 12,
  },
  header: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subSectionHeader: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  listTextName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  listTextValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  listTextSubValue: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '400',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
    fontStyle: 'italic',
  },
  moreText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

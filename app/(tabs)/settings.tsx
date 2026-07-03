import React from 'react';
import { Text, StyleSheet, ScrollView, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FOG_THEMES, H3_RESOLUTION_METRICS } from '@/utils/constants';
import { useSettingsStore } from '@/store/settingsStore';
import { getDatabase, loadAllCells, insertCellsBatch } from '@/database/db';
import { useExplorationStore } from '@/store/explorationStore';
import { useAchievementsStore } from '@/store/achievementsStore';
import { useStatsStore } from '@/store/statsStore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export default function SettingsScreen() {
  const { themeId, setThemeId, h3Resolution, setH3Resolution } = useSettingsStore();

  const handleExportData = async () => {
    try {
      const cells = await loadAllCells();
      if (cells.length === 0) {
        Alert.alert('Export impossible', 'Vous n\'avez aucun hexagone exploré à exporter.');
        return;
      }
      
      const dataStr = JSON.stringify(cells, null, 2);
      const fileUri = FileSystem.documentDirectory + 'explored_cells_backup.json';
      
      await FileSystem.writeAsStringAsync(fileUri, dataStr, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Exporter mes données d\'exploration',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil.');
      }
    } catch (e) {
      console.error('[SettingsScreen] Export failed:', e);
      Alert.alert('Erreur', 'Impossible d\'exporter les données.');
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) return;
      
      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      const importedCells = JSON.parse(fileContent);
      
      if (!Array.isArray(importedCells)) {
        throw new Error('Format invalide (doit être un tableau)');
      }
      
      // Valider la structure du fichier
      for (const cell of importedCells) {
        if (!cell.index || typeof cell.lat !== 'number' || typeof cell.lng !== 'number') {
          throw new Error('Format de cellule invalide');
        }
      }
      
      Alert.alert(
        'Importer des données',
        `Voulez-vous importer les ${importedCells.length} cellules d'exploration de ce fichier ? Les doublons seront ignorés.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Importer',
            onPress: async () => {
              try {
                // Formater proprement les cellules pour l'insertion
                const cellsToInsert = importedCells.map((c) => ({
                  index: c.index,
                  discoveredAt: typeof c.discoveredAt === 'number' ? c.discoveredAt : Date.now(),
                  lat: c.lat,
                  lng: c.lng,
                  country: c.country || null,
                  city: c.city || null,
                }));
                
                await insertCellsBatch(cellsToInsert);
                
                // Recharger les stores
                await useExplorationStore.getState().loadFromDatabase();
                await useAchievementsStore.getState().loadFromStorage();
                useStatsStore.getState().recompute();
                
                Alert.alert('Importation réussie', `${importedCells.length} cellules ont été importées avec succès.`);
              } catch (e) {
                console.error('[SettingsScreen] Import database insertion failed:', e);
                Alert.alert('Erreur', 'Échec de l\'écriture en base de données.');
              }
            },
          },
        ]
      );
    } catch (e) {
      console.error('[SettingsScreen] Import failed:', e);
      Alert.alert('Erreur de fichier', 'Le fichier sélectionné n\'est pas un fichier de sauvegarde valide.');
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Réinitialiser les données',
      'Êtes-vous sûr de vouloir supprimer tous vos hexagones explorés et vos succès ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              await db.withTransactionAsync(async () => {
                await db.runAsync('DELETE FROM explored_cells;');
                await db.runAsync('DELETE FROM achievements;');
              });
              
              // Recharger les stores pour mettre à jour l'UI instantanément
              await useExplorationStore.getState().loadFromDatabase();
              await useAchievementsStore.getState().loadFromStorage();
              useStatsStore.getState().recompute();
              
              Alert.alert('Réinitialisation réussie', 'Toutes vos données d\'exploration ont été effacées.');
            } catch (e) {
              console.error('[SettingsScreen] Reset failed:', e);
              Alert.alert('Erreur', 'Impossible de réinitialiser les données.');
            }
          },
        },
      ]
    );
  };

  const handleResolutionChange = (newRes: number) => {
    if (newRes === h3Resolution) return;

    Alert.alert(
      'Changer la taille des hexagones',
      `Voulez-vous passer à la taille "${H3_RESOLUTION_METRICS[newRes].label}" ? Vos données d'exploration existantes seront converties à cette nouvelle échelle.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await setH3Resolution(newRes);
              Alert.alert('Échelle modifiée', 'La taille des hexagones a été mise à jour avec succès.');
            } catch (e) {
              console.error('[SettingsScreen] Failed to change resolution:', e);
              Alert.alert('Erreur', 'Impossible de modifier la taille des hexagones.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Réglages</Text>

        {/* Section Personnalisation du brouillard */}
        <Text style={styles.sectionHeader}>🎨 Personnalisation</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.subSectionHeader}>Thème du Brouillard</Text>
          {Object.values(FOG_THEMES).map((theme, i) => {
            const isSelected = theme.id === themeId;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeItem,
                  isSelected && styles.themeItemActive,
                  i === Object.values(FOG_THEMES).length - 1 && styles.noBorder
                ]}
                onPress={() => setThemeId(theme.id)}
                activeOpacity={0.7}
              >
                <View style={styles.themeRow}>
                  <View style={[styles.colorDot, { backgroundColor: theme.accentColor }]} />
                  <Text style={[styles.themeName, isSelected && styles.themeNameActive]}>
                    {theme.name}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.accentColor} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section Taille de la Grille */}
        <Text style={styles.sectionHeader}>📐 Taille de la Grille</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.subSectionHeader}>Résolution des Hexagones</Text>
          {Object.entries(H3_RESOLUTION_METRICS).map(([resStr, metric], i, arr) => {
            const resVal = Number(resStr);
            const isSelected = resVal === h3Resolution;
            return (
              <TouchableOpacity
                key={resVal}
                style={[
                  styles.themeItem,
                  isSelected && styles.themeItemActive,
                  i === arr.length - 1 && styles.noBorder
                ]}
                onPress={() => handleResolutionChange(resVal)}
                activeOpacity={0.7}
              >
                <View style={styles.resolutionContainer}>
                  <Text style={[styles.themeName, isSelected && styles.themeNameActive]}>
                    {metric.label} (Résolution {resVal})
                  </Text>
                  <Text style={styles.resolutionDesc}>
                    {metric.description}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section Sauvegarde */}
        <Text style={styles.sectionHeader}>💾 Sauvegarde & Export</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleExportData}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={20} color={COLORS.accent} />
            <Text style={styles.settingsButtonText}>Exporter les données (.json)</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleImportData}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-upload-outline" size={20} color={COLORS.accent} />
            <Text style={styles.settingsButtonText}>Importer des données (.json)</Text>
          </TouchableOpacity>
        </View>

        {/* Section Administration / Danger */}
        <Text style={styles.sectionHeader}>⚠️ Données & Sécurité</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            <Text style={styles.resetButtonText}>Réinitialiser toutes les données</Text>
          </TouchableOpacity>
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
  themeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  themeItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeName: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  themeNameActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  resolutionContainer: {
    flexDirection: 'column',
    flex: 1,
    paddingRight: 10,
  },
  resolutionDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  settingsButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  resetButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
});

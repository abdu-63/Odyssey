import { create } from 'zustand';
import { getDatabase, getMetadata, insertCellsBatch, loadAllCells, setMetadata } from '@/database/db';
import type { FogThemeId } from '@/utils/constants';
import { latLngToCell } from 'h3-js';

interface SettingsState {
  themeId: FogThemeId;
  h3Resolution: number;
  isLoading: boolean;
  setThemeId: (themeId: FogThemeId) => Promise<void>;
  setH3Resolution: (resolution: number) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  themeId: 'classic',
  h3Resolution: 10,
  isLoading: true,

  setThemeId: async (themeId: FogThemeId) => {
    set({ themeId });
    try {
      await setMetadata('fog_theme', themeId);
    } catch (e) {
      console.error('[SettingsStore] Failed to save theme:', e);
    }
  },

  setH3Resolution: async (resolution: number) => {
    // 1. Charger toutes les cellules actuelles depuis la base
    const cells = await loadAllCells();

    // 2. Mettre à jour le state et la base de données
    set({ h3Resolution: resolution });
    try {
      await setMetadata('h3_resolution', String(resolution));
    } catch (e) {
      console.error('[SettingsStore] Failed to save resolution:', e);
    }

    // 3. Recalculer les cellules à la nouvelle résolution
    const migratedCellsMap = new Map<string, any>();
    for (const cell of cells) {
      const newIndex = latLngToCell(cell.lat, cell.lng, resolution);
      const existing = migratedCellsMap.get(newIndex);
      // Dédoublonnage : on conserve la date de découverte la plus ancienne
      if (!existing || existing.discoveredAt > cell.discoveredAt) {
        migratedCellsMap.set(newIndex, {
          ...cell,
          index: newIndex,
        });
      }
    }
    const finalCells = Array.from(migratedCellsMap.values());

    // 4. Supprimer les anciennes cellules et insérer les nouvelles
    const db = getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM explored_cells;');
    });
    await insertCellsBatch(finalCells);

    // 5. Rafraîchir les autres stores (require pour éviter dépendances circulaires au chargement)
    const { useExplorationStore } = require('./explorationStore');
    const { useAchievementsStore } = require('./achievementsStore');
    const { useStatsStore } = require('./statsStore');

    await useExplorationStore.getState().loadFromDatabase();
    await useAchievementsStore.getState().loadFromStorage();
    useStatsStore.getState().recompute();
  },

  loadSettings: async () => {
    try {
      const savedTheme = await getMetadata('fog_theme');
      const savedRes = await getMetadata('h3_resolution');
      
      const updates: Partial<SettingsState> = { isLoading: false };
      if (savedTheme) {
        updates.themeId = savedTheme as FogThemeId;
      }
      if (savedRes) {
        updates.h3Resolution = Number(savedRes);
      }
      
      set(updates);
    } catch (e) {
      console.error('[SettingsStore] Failed to load settings:', e);
      set({ isLoading: false });
    }
  },
}));

import { create } from 'zustand';
import { getMetadata, setMetadata } from '@/database/db';
import type { FogThemeId } from '@/utils/constants';

interface SettingsState {
  themeId: FogThemeId;
  isLoading: boolean;
  setThemeId: (themeId: FogThemeId) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  themeId: 'classic',
  isLoading: true,

  setThemeId: async (themeId: FogThemeId) => {
    set({ themeId });
    try {
      await setMetadata('fog_theme', themeId);
    } catch (e) {
      console.error('[SettingsStore] Failed to save theme:', e);
    }
  },

  loadSettings: async () => {
    try {
      const savedTheme = await getMetadata('fog_theme');
      if (savedTheme) {
        set({ themeId: savedTheme as FogThemeId, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('[SettingsStore] Failed to load theme:', e);
      set({ isLoading: false });
    }
  },
}));

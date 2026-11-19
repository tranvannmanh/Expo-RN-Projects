import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandMMKVStorage } from '@/shared/services/storage.service';

import { DEFAULT_EXPORT_SETTINGS } from '../constants/editor.constants';
import type { EditRecipe, ExportSettings } from '../types/editor.types';

type EditorSettingsState = {
  exportSettings: ExportSettings;
  /** Recipe of the last exported photo, offered as "paste edits". */
  lastRecipe: EditRecipe | null;
  setExportSettings: (patch: Partial<ExportSettings>) => void;
  setLastRecipe: (recipe: EditRecipe) => void;
};

export const useEditorSettingsStore = create<EditorSettingsState>()(
  persist(
    (set) => ({
      exportSettings: DEFAULT_EXPORT_SETTINGS,
      lastRecipe: null,
      setExportSettings: (patch) =>
        set((s) => ({ exportSettings: { ...s.exportSettings, ...patch } })),
      setLastRecipe: (lastRecipe) => set({ lastRecipe }),
    }),
    {
      name: 'photo-editor.settings',
      storage: createJSONStorage(() => zustandMMKVStorage),
    },
  ),
);

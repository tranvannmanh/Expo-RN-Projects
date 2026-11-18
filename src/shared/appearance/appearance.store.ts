import { Appearance } from 'react-native';
import { create } from 'zustand';

import { StorageService } from '@/shared/services/storage.service';

/** 'system' follows the phone's light/dark setting. */
export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'settings.theme';
const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

/**
 * Overrides the app's colour scheme for React Native (`useColorScheme`) and the native side
 * (Android AppCompat night mode: system dialogs, pickers), so every themed component follows
 * without extra wiring. 'unspecified' hands control back to the system.
 */
function apply(preference: ThemePreference) {
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
}

function load(): ThemePreference {
  const stored = StorageService.get(STORAGE_KEY);
  return PREFERENCES.includes(stored as ThemePreference) ? (stored as ThemePreference) : 'system';
}

type AppearanceState = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const initial = load();
// Applied at import time (root layout imports this) so the first frame already uses it.
apply(initial);

export const useAppearanceStore = create<AppearanceState>((set) => ({
  preference: initial,
  setPreference: (preference) => {
    StorageService.set(STORAGE_KEY, preference);
    apply(preference);
    set({ preference });
  },
}));

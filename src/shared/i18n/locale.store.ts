import { create } from 'zustand';

import { StorageService } from '@/shared/services/storage.service';

export type Language = 'en' | 'vi';
/** 'system' follows the phone's language. */
export type LanguagePreference = 'system' | Language;

const STORAGE_KEY = 'settings.language';
const PREFERENCES: readonly LanguagePreference[] = ['system', 'en', 'vi'];

/** Phone language via Hermes Intl (no native module needed). Anything not Vietnamese → English. */
export function deviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return locale.toLowerCase().startsWith('vi') ? 'vi' : 'en';
  } catch {
    return 'en';
  }
}

export function resolveLanguage(preference: LanguagePreference): Language {
  return preference === 'system' ? deviceLanguage() : preference;
}

function loadPreference(): LanguagePreference {
  const stored = StorageService.get(STORAGE_KEY);
  return PREFERENCES.includes(stored as LanguagePreference) ? (stored as LanguagePreference) : 'system';
}

type LocaleState = {
  preference: LanguagePreference;
  language: Language;
  setPreference: (preference: LanguagePreference) => void;
  /** Re-reads the phone language (call when the app returns to the foreground). */
  refreshSystemLanguage: () => void;
};

const initial = loadPreference();

export const useLocaleStore = create<LocaleState>((set, get) => ({
  preference: initial,
  language: resolveLanguage(initial),
  setPreference: (preference) => {
    StorageService.set(STORAGE_KEY, preference);
    set({ preference, language: resolveLanguage(preference) });
  },
  refreshSystemLanguage: () => {
    const { preference, language } = get();
    const next = resolveLanguage(preference);
    if (next !== language) set({ language: next });
  },
}));

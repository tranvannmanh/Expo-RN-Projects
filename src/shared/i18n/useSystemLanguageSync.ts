import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useLocaleStore } from './locale.store';

/**
 * With the "System default" preference, picks up a phone language change made while the app
 * was in the background (Android keeps the process alive across a locale change).
 */
export function useSystemLanguageSync() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') useLocaleStore.getState().refreshSystemLanguage();
    });
    return () => subscription.remove();
  }, []);
}

import { en, type Messages } from './messages/en';
import { vi } from './messages/vi';
import { type Language, useLocaleStore } from './locale.store';

export type { Messages } from './messages/en';
export {
  deviceLanguage,
  type Language,
  type LanguagePreference,
  useLocaleStore,
} from './locale.store';

const DICTIONARIES: Record<Language, Messages> = { en, vi };

/** Messages for the current language; re-renders the component when the language changes. */
export function useT(): Messages {
  return DICTIONARIES[useLocaleStore((state) => state.language)];
}

/**
 * Messages outside React (services, Alert callbacks). Reads the current language at call time,
 * so names created by services follow the language active when they were created.
 */
export function getT(): Messages {
  return DICTIONARIES[useLocaleStore.getState().language];
}

/**
 * Date + time, e.g. "Nov 17, 2026, 2:36 PM" / "14:36 17 thg 11, 2026".
 * Components must pass `t.locale` so the value re-renders (and is re-memoised by the React
 * Compiler) when the language changes; services may rely on the current language.
 */
export function formatDateTime(value: Date | number, locale: string = getT().locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

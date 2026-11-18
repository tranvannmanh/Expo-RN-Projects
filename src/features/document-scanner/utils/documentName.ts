import { formatDateTime, getT } from '@/shared/i18n';

/** e.g. "Scan Nov 17, 2026, 11:58 AM" / "Bản quét 17 thg 11, 2026, 11:58" (current language). */
export function defaultDocumentName(date: Date): string {
  return getT().documents.defaultName(formatDateTime(date));
}

export function formatDocumentDate(timestamp: number, locale: string): string {
  return formatDateTime(timestamp, locale);
}

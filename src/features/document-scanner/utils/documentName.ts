const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** e.g. "Scan Nov 17, 2026, 11:58 AM" (device locale). */
export function defaultDocumentName(date: Date): string {
  return `Scan ${formatter.format(date)}`;
}

export function formatDocumentDate(timestamp: number): string {
  return formatter.format(new Date(timestamp));
}

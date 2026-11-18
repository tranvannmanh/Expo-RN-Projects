const UNITS = ['B', 'KB', 'MB', 'GB'] as const;
const STEP = 1024;

/** 1536 → "1.5 KB" */
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= STEP && unit < UNITS.length - 1) {
    value /= STEP;
    unit++;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[unit]}`;
}

/** Percentage saved, e.g. (1000, 400) → 60 */
export function savedPercent(before: number, after: number): number {
  return before > 0 ? Math.round((1 - after / before) * 100) : 0;
}

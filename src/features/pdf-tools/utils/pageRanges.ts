import type { PageRange } from '@modules/pdf-tools';

import { AppError } from '@/shared/errors/appError';
import { getT } from '@/shared/i18n';

/**
 * Parses "1-3, 5, 8-10" into ranges. Each comma-separated part becomes one output PDF.
 * Throws INVALID_PAGE_RANGE (with a message naming the bad part) when anything is off.
 */
export function parsePageRanges(input: string, pageCount: number): PageRange[] {
  const parts = input
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) throw invalid(getT().pdfTools.split.errEmpty);

  return parts.map((part) => {
    const match = /^(\d+)\s*(?:-\s*(\d+))?$/.exec(part);
    if (!match) throw invalid(getT().pdfTools.split.errFormat(part));
    const from = Number(match[1]);
    const to = match[2] === undefined ? from : Number(match[2]);
    if (from < 1 || to > pageCount) throw invalid(getT().pdfTools.split.errOutside(part, pageCount));
    if (from > to) throw invalid(getT().pdfTools.split.errBackwards(part));
    return { from, to };
  });
}

/** One range per page: "1, 2, 3, …" — the "split every page" shortcut. */
export function everyPage(pageCount: number): PageRange[] {
  return Array.from({ length: pageCount }, (_, i) => ({ from: i + 1, to: i + 1 }));
}

export function formatRange({ from, to }: PageRange): string {
  return getT().pdfTools.split.range(from, to);
}

const invalid = (message: string) => new AppError('INVALID_PAGE_RANGE', message);

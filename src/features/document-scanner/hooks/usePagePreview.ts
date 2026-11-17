import { useCallback, useState } from 'react';

/** Tracks which scanned page (if any) is open in the full-screen preview. */
export function usePagePreview() {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const openPreview = useCallback((index: number) => setPreviewIndex(index), []);
  const closePreview = useCallback(() => setPreviewIndex(null), []);

  return { previewIndex, openPreview, closePreview };
}

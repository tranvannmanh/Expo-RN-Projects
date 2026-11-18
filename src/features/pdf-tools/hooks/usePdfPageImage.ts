import { useEffect, useState } from 'react';

import { cachedPreviewPage, renderPreviewPage } from '../services/pdfTools.service';
import { pageRenderQueue } from '../services/pageRenderQueue';
import type { PdfFile } from '../types/pdfFile';
import { RENDER_PRIORITY, VIEWER } from '../constants';

/** Subscribes to one rendered tier of a page; unsubscribing on unmount cancels queued work. */
function useTier(file: PdfFile, index: number, width: number, enabled: boolean, priority: number) {
  const [uri, setUri] = useState<string | null>(() => cachedPreviewPage(file.id, index, width));
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const cached = cachedPreviewPage(file.id, index, width);
    setUri(cached);
    setFailed(false);
    if (cached || !enabled) return;
    return pageRenderQueue.request(
      `${file.id}:${index}:${width}`,
      priority,
      () => renderPreviewPage(file, index, width),
      (result) => ('uri' in result ? setUri(result.uri) : setFailed(true)),
    );
  }, [file, index, width, enabled, priority, attempt]);

  return { uri, failed, retry: () => setAttempt((n) => n + 1) };
}

/**
 * Best available image for a viewer page: a small image as soon as the page is near the screen,
 * then a sharp one sized for the current zoom once the page has been visible for a moment.
 */
export function usePdfPageImage(
  file: PdfFile,
  index: number,
  { visible, settled, sharpWidth }: { visible: boolean; settled: boolean; sharpWidth: number },
) {
  const low = useTier(
    file,
    index,
    VIEWER.lowResWidth,
    true,
    visible ? RENDER_PRIORITY.visibleLow : RENDER_PRIORITY.nearbyLow,
  );
  const sharp = useTier(file, index, sharpWidth, settled, RENDER_PRIORITY.visibleSharp);

  return {
    lowUri: low.uri,
    // Sharp bitmaps are ~10× larger: only pages on screen hold one. A page that scrolled off
    // (but is still mounted in the list window) falls back to the small image.
    uri: (settled ? sharp.uri : null) ?? low.uri,
    failed: low.failed && !sharp.uri,
    retry: () => {
      low.retry();
      sharp.retry();
    },
  };
}

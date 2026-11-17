import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';

import * as exporter from '../services/export.service';
import type { PageView } from '../types/document';
import { useDocumentMutation } from './useDocumentMutations';

/**
 * PDF + page-image export actions for one document. `notice` holds the last success message
 * for the UI; errors surface through each mutation's `error`.
 */
export function useDocumentExport(documentId: string, documentName: string) {
  const db = useSQLiteContext();
  const [notice, setNotice] = useState<string | null>(null);

  const sharePdf = useDocumentMutation(
    'share pdf',
    () => exporter.sharePdf(db, documentId),
    'EXPORT_ERROR',
  );

  const savePdfToDocuments = useDocumentMutation(
    'save pdf',
    async () => {
      const result = await exporter.savePdfToDocuments(db, documentId);
      setNotice(`Saved to ${result.displayPath}`);
    },
    'EXPORT_ERROR',
  );

  const savePdfWithPicker = useDocumentMutation(
    'save pdf (picker)',
    async () => {
      const result = await exporter.savePdfWithPicker(db, documentId);
      setNotice(result.cancelled ? null : 'PDF saved to the selected location.');
    },
    'EXPORT_ERROR',
  );

  const sharePage = useDocumentMutation(
    'share page',
    (page: PageView) => exporter.sharePage(documentName, page),
    'EXPORT_ERROR',
  );

  const savePage = useDocumentMutation(
    'save page',
    async (page: PageView) => {
      const result = await exporter.savePageToPictures(documentName, page);
      setNotice(`Page ${page.pageNumber} saved to ${result.displayPath}`);
    },
    'EXPORT_ERROR',
  );

  const all = [sharePdf, savePdfToDocuments, savePdfWithPicker, sharePage, savePage];

  return {
    canSaveToPublicFolder: exporter.canSaveToPublicFolder(),
    busy: all.some((m) => m.isPending),
    error: all.find((m) => m.error)?.error ?? null,
    notice,
    clearNotice: () => setNotice(null),
    sharePdf: () => sharePdf.mutate(undefined),
    savePdfToDocuments: () => savePdfToDocuments.mutate(undefined),
    savePdfWithPicker: () => savePdfWithPicker.mutate(undefined),
    sharePage: (page: PageView) => sharePage.mutate(page),
    savePage: (page: PageView) => savePage.mutate(page),
  };
}

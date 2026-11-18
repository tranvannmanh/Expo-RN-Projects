import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';

import { addStoredPdf } from '@/features/pdf-tools/services/pdfTools.service';

import * as exporter from '../services/export.service';
import type { PageView } from '../types/document';
import { useDocumentMutation } from './useDocumentMutations';
import { getT } from '@/shared/i18n';

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
      setNotice(getT().common.savedTo(result.displayPath));
    },
    'EXPORT_ERROR',
  );

  const savePdfWithPicker = useDocumentMutation(
    'save pdf (picker)',
    async () => {
      const result = await exporter.savePdfWithPicker(db, documentId);
      setNotice(result.cancelled ? null : getT().common.savedToPicked);
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
      setNotice(getT().documents.pageSavedTo(page.pageNumber, result.displayPath));
    },
    'EXPORT_ERROR',
  );

  /** Copies the up-to-date PDF into PDF Tools (the scanned document itself is unchanged). */
  const sendToPdfTools = useDocumentMutation(
    'send to pdf tools',
    async () => addStoredPdf(db, await exporter.ensurePdf(db, documentId), documentName, 'document'),
    'PDF_EXPORT_ERROR',
  );

  const all = [sharePdf, savePdfToDocuments, savePdfWithPicker, sharePage, savePage, sendToPdfTools];

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
    /** Resolves with the new PDF Tools file id. */
    sendToPdfTools: (onDone: (pdfFileId: string) => void) =>
      sendToPdfTools.mutate(undefined, { onSuccess: (file) => onDone(file.id) }),
  };
}

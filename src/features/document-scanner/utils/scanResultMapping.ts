import type { ScanDocumentResult } from '@modules/document-scanner';

import { toRelativePath } from '../services/documentFileStorage';
import type { NewDocumentPage } from '../types/document';
import { DocumentError } from '../types/errors';

export type MappedScan = {
  documentId: string;
  pages: NewDocumentPage[];
  pdfPath: string | null;
};

/** Page ids are derived from the (unique, stable) stored file name. */
function pageIdFromPath(documentId: string, relativePath: string): string {
  const fileName = relativePath.slice(relativePath.lastIndexOf('/') + 1);
  return `${documentId}:${fileName.replace(/\.[^.]+$/, '')}`;
}

/** Validates a successful native scan result and converts it to storable rows. */
export function mapScanResult(result: ScanDocumentResult): MappedScan {
  const { documentId, pages } = result;
  if (result.cancelled || !documentId || !pages?.length) {
    throw new DocumentError('SCAN_RESULT_ERROR', 'Scan result has no document or pages');
  }

  const ordered = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  return {
    documentId,
    pages: ordered.map((page) => {
      const processedPath = toRelativePath(page.uri);
      return {
        id: pageIdFromPath(documentId, processedPath),
        processedPath,
        // ML Kit returns processed output only; there is no untouched original.
        originalPath: null,
      };
    }),
    pdfPath: result.pdfUri ? toRelativePath(result.pdfUri) : null,
  };
}

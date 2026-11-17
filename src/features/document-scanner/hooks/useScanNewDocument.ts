import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { scanDocument } from '@modules/document-scanner';

import { createDocumentFromScan, reconcileStorage } from '../services/document.service';
import type { ScannedDocument } from '../types/document';
import { toDocumentError } from '../types/errors';
import { defaultDocumentName } from '../utils/documentName';
import { documentKeys } from './queryKeys';

/**
 * Opens the scanner and saves the result as a new document.
 * Resolves to null when the user cancels.
 */
export function useScanNewDocument() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name?: string): Promise<ScannedDocument | null> => {
      try {
        await reconcileStorage(db);
        const result = await scanDocument();
        if (result.cancelled) return null;
        return await createDocumentFromScan(db, name ?? defaultDocumentName(new Date()), result);
      } catch (error) {
        const documentError = toDocumentError(error, 'SCAN_RESULT_ERROR');
        console.error('[Documents] scan failed', documentError.code, documentError.cause);
        throw documentError;
      }
    },
    onSuccess: (document) => {
      if (document) void queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

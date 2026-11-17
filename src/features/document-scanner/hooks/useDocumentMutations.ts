import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { scanDocument } from '@modules/document-scanner';

import * as service from '../services/document.service';
import { type DocumentErrorCode, toDocumentError } from '../types/errors';
import { documentKeys } from './queryKeys';

/**
 * Wraps a document mutation: normalises errors to DocumentError, logs technical details
 * and refreshes every document query (list, detail, pages share the 'documents' prefix).
 */
export function useDocumentMutation<TVariables, TResult = void>(
  label: string,
  mutationFn: (variables: TVariables) => Promise<TResult>,
  fallbackCode: DocumentErrorCode = 'DATABASE_ERROR',
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        const documentError = toDocumentError(error, fallbackCode);
        console.error(`[Documents] ${label} failed`, documentError.code, documentError.cause);
        throw documentError;
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useRenameDocument(documentId: string) {
  const db = useSQLiteContext();
  return useDocumentMutation('rename', (name: string) =>
    service.renameDocument(db, documentId, name),
  );
}

export function useDeletePage() {
  const db = useSQLiteContext();
  return useDocumentMutation('delete page', (pageId: string) => service.deletePage(db, pageId));
}

export function useReorderPages(documentId: string) {
  const db = useSQLiteContext();
  return useDocumentMutation('reorder', (orderedPageIds: string[]) =>
    service.reorderPages(db, documentId, orderedPageIds),
  );
}

/** Opens the scanner for an existing document. Resolves to false when cancelled. */
export function useAddPages(documentId: string) {
  const db = useSQLiteContext();
  return useDocumentMutation(
    'add pages',
    async (_: void) => {
      const result = await scanDocument({ documentId, includePdf: false });
      if (result.cancelled) return false;
      await service.addPagesFromScan(db, documentId, result);
      return true;
    },
    'SCAN_RESULT_ERROR',
  );
}

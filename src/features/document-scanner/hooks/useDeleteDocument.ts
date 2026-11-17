import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { deleteDocument } from '../services/document.service';
import { toDocumentError } from '../types/errors';
import { documentKeys } from './queryKeys';

export function useDeleteDocument() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      try {
        await deleteDocument(db, documentId);
      } catch (error) {
        const documentError = toDocumentError(error);
        console.error('[Documents] delete failed', documentError.code, documentError.cause);
        throw documentError;
      }
    },
    onSuccess: (_, documentId) => {
      queryClient.removeQueries({ queryKey: documentKeys.pages(documentId) });
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

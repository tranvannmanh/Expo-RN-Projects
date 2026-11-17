import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { listPages } from '../services/document.service';
import { fileExists, toFileUri } from '../services/documentFileStorage';
import type { PageView } from '../types/document';
import { documentKeys } from './queryKeys';

/** Pages of a document resolved to displayable file URIs. Disabled when id is null. */
export function useDocumentPages(documentId: string | null) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: documentKeys.pages(documentId ?? ''),
    enabled: documentId !== null,
    queryFn: async (): Promise<PageView[]> => {
      const pages = await listPages(db, documentId ?? '');
      return pages.map((page) => ({
        id: page.id,
        pageNumber: page.pageNumber,
        uri: toFileUri(page.processedPath),
        missing: !fileExists(page.processedPath),
      }));
    },
  });
}

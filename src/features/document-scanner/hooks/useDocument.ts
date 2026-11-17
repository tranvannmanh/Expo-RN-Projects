import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { getDocument } from '../services/document.service';
import { documentKeys } from './queryKeys';

/** A single document; resolves to null when it does not exist (e.g. just deleted). */
export function useDocument(documentId: string) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: documentKeys.detail(documentId),
    queryFn: () => getDocument(db, documentId),
  });
}

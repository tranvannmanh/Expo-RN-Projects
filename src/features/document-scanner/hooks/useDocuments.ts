import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { listDocuments, reconcileStorage } from '../services/document.service';
import { documentKeys } from './queryKeys';

/** All saved documents, newest first. Cleans orphan files once per app start. */
export function useDocuments() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: documentKeys.all,
    queryFn: async () => {
      const report = await reconcileStorage(db);
      if (report.removedFolders.length > 0) {
        console.warn('[Documents] removed orphan folders', report.removedFolders);
      }
      return listDocuments(db);
    },
  });
}

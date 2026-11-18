import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { getPdfFile, listPdfFiles } from '../services/pdfTools.service';
import { pdfFileKeys } from './queryKeys';

/** All PDFs in PDF Tools, newest first (cleans orphan files once per app start). */
export function usePdfFiles() {
  const db = useSQLiteContext();
  return useQuery({ queryKey: pdfFileKeys.all, queryFn: () => listPdfFiles(db) });
}

/** One PDF; resolves to null when it does not exist (e.g. just deleted). */
export function usePdfFile(id: string) {
  const db = useSQLiteContext();
  return useQuery({ queryKey: pdfFileKeys.detail(id), queryFn: () => getPdfFile(db, id) });
}


import type { SQLiteDatabase } from 'expo-sqlite';

import type { ScanDocumentResult } from '@modules/document-scanner';
import { migrateDatabase } from '@/shared/database/migrations';

import { memoryFs } from './mocks/expoFileSystem';
import { createTestDatabase } from './sqliteTestDatabase';

export async function createMigratedDatabase(): Promise<SQLiteDatabase & { close(): void }> {
  const db = createTestDatabase();
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await migrateDatabase(db);
  return db;
}

/**
 * Simulates what the native module does after a scan: page files (and optionally a PDF)
 * exist under documents/{id}/ and the result points at them with file:// URIs.
 */
export function fakeScan(
  documentId: string,
  pageCount: number,
  { scanId = 'scan1', withPdf = true } = {},
): ScanDocumentResult {
  const pages = Array.from({ length: pageCount }, (_, i) => {
    const relative = `documents/${documentId}/processed/page_${scanId}_${String(i + 1).padStart(3, '0')}.jpg`;
    memoryFs.write(relative);
    return { pageNumber: i + 1, uri: `${memoryFs.root}${relative}` };
  });
  let pdfUri: string | null = null;
  if (withPdf) {
    memoryFs.write(`documents/${documentId}/document.pdf`);
    pdfUri = `${memoryFs.root}documents/${documentId}/document.pdf`;
  }
  return { cancelled: false, documentId, pages, pdfUri, pageCount };
}

/** Page ids in display order, as stored file names without the extension. */
export async function pageOrder(db: SQLiteDatabase, documentId: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM document_pages WHERE document_id = ? ORDER BY page_number',
    documentId,
  );
  return rows.map((row) => row.id.split(':')[1]);
}

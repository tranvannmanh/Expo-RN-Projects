import type { SQLiteDatabase } from 'expo-sqlite';

import type { NewPdfFile, PdfFile, PdfFileSource } from '../types/pdfFile';

type PdfFileRow = {
  id: string;
  name: string;
  path: string;
  size_bytes: number;
  page_count: number;
  source: PdfFileSource;
  thumbnail_path: string | null;
  created_at: number;
};

const toPdfFile = (row: PdfFileRow): PdfFile => ({
  id: row.id,
  name: row.name,
  path: row.path,
  sizeBytes: row.size_bytes,
  pageCount: row.page_count,
  source: row.source,
  thumbnailPath: row.thumbnail_path,
  createdAt: row.created_at,
});

export async function listPdfFiles(db: SQLiteDatabase): Promise<PdfFile[]> {
  const rows = await db.getAllAsync<PdfFileRow>(
    'SELECT * FROM pdf_files ORDER BY created_at DESC, rowid DESC',
  );
  return rows.map(toPdfFile);
}

export async function getPdfFile(db: SQLiteDatabase, id: string): Promise<PdfFile | null> {
  const row = await db.getFirstAsync<PdfFileRow>('SELECT * FROM pdf_files WHERE id = ?', id);
  return row ? toPdfFile(row) : null;
}

/** All file paths referenced by the table (PDFs and thumbnails). */
export async function listReferencedPaths(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ path: string; thumbnail_path: string | null }>(
    'SELECT path, thumbnail_path FROM pdf_files',
  );
  return rows.flatMap((r) => (r.thumbnail_path ? [r.path, r.thumbnail_path] : [r.path]));
}

/**
 * Inserts several files atomically (e.g. every part of a split) and returns them as stored.
 * The result is built from the inserted values, so callers never need a second read that could
 * fail after the data was already committed.
 */
export async function insertPdfFiles(
  db: SQLiteDatabase,
  files: NewPdfFile[],
  now: number,
): Promise<PdfFile[]> {
  // Later entries get earlier timestamps so the given order shows up in the newest-first list.
  const stored = files.map((file, index) => ({ ...file, createdAt: now + files.length - 1 - index }));
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const file of stored) {
      await txn.runAsync(
        `INSERT INTO pdf_files (id, name, path, size_bytes, page_count, source, thumbnail_path, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        file.id,
        file.name,
        file.path,
        file.sizeBytes,
        file.pageCount,
        file.source,
        file.thumbnailPath,
        file.createdAt,
      );
    }
  });
  return stored;
}

export async function renamePdfFile(
  db: SQLiteDatabase,
  id: string,
  name: string,
): Promise<boolean> {
  const result = await db.runAsync('UPDATE pdf_files SET name = ? WHERE id = ?', name, id);
  return result.changes > 0;
}

export async function deletePdfFile(db: SQLiteDatabase, id: string): Promise<PdfFile | null> {
  const file = await getPdfFile(db, id);
  if (!file) return null;
  await db.runAsync('DELETE FROM pdf_files WHERE id = ?', id);
  return file;
}

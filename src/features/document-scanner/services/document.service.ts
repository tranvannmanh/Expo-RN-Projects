import type { SQLiteDatabase } from 'expo-sqlite';

import type { ScanDocumentResult } from '@modules/document-scanner';

import * as repo from '../repositories/document.repository';
import type { DocumentPage, DocumentSummary, ScannedDocument } from '../types/document';
import { DocumentError, toDocumentError } from '../types/errors';
import { mapScanResult } from '../utils/scanResultMapping';
import * as storage from './documentFileStorage';

/*
 * Consistency rules (SQLite is the source of truth for metadata):
 * - Create: files are written by the native scanner first, then rows are inserted in one
 *   transaction. If the insert fails, the new files are deleted.
 * - Delete: rows are deleted first, then files. A failed file delete only leaves an
 *   orphan folder, which `reconcileStorage` removes on the next start.
 * - Any page change invalidates the stored PDF (row reference cleared + file removed).
 */

export const MAX_NAME_LENGTH = 120;

export function normalizeDocumentName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);
  if (!trimmed) throw new DocumentError('INVALID_INPUT', 'Document name must not be empty');
  return trimmed;
}

let reconciliation: Promise<ReconcileReport> | null = null;

export type ReconcileReport = { removedFolders: string[] };

/**
 * Removes document folders that have no database row (left behind by a crash between
 * the native copy and the DB insert, or by a failed file delete). Runs once per app
 * process; scans await it so a fresh scan folder is never mistaken for an orphan.
 */
export function reconcileStorage(db: SQLiteDatabase): Promise<ReconcileReport> {
  reconciliation ??= (async () => {
    const known = new Set(await repo.listDocumentIds(db));
    const orphans = storage.listDocumentFolderIds().filter((id) => !known.has(id));
    for (const id of orphans) storage.deleteDocumentFiles(id);
    // No share can be in progress at app start, so leftover share copies are garbage.
    storage.clearShareCache();
    return { removedFolders: orphans };
  })().catch((error: unknown) => {
    reconciliation = null;
    throw toDocumentError(error);
  });
  return reconciliation;
}

export async function listDocuments(db: SQLiteDatabase): Promise<DocumentSummary[]> {
  return withDbErrors(() => repo.listDocuments(db));
}

export async function getDocument(
  db: SQLiteDatabase,
  id: string,
): Promise<ScannedDocument | null> {
  return withDbErrors(() => repo.getDocument(db, id));
}

export async function listPages(db: SQLiteDatabase, documentId: string): Promise<DocumentPage[]> {
  return withDbErrors(() => repo.listPages(db, documentId));
}

/** Persists a completed native scan as a new document. */
export async function createDocumentFromScan(
  db: SQLiteDatabase,
  name: string,
  result: ScanDocumentResult,
): Promise<ScannedDocument> {
  const scan = mapScanResult(result);
  try {
    const now = Date.now();
    await repo.insertDocumentWithPages(
      db,
      { id: scan.documentId, name: normalizeDocumentName(name), pdfPath: scan.pdfPath },
      scan.pages,
      now,
    );
    const created = await repo.getDocument(db, scan.documentId);
    if (!created) throw new Error('Inserted document could not be read back');
    return created;
  } catch (error) {
    storage.deleteDocumentFiles(scan.documentId);
    throw toDocumentError(error);
  }
}

/** Appends pages from a scan started with `{ documentId, includePdf: false }`. */
export async function addPagesFromScan(
  db: SQLiteDatabase,
  documentId: string,
  result: ScanDocumentResult,
): Promise<void> {
  const scan = mapScanResult(result);
  if (scan.documentId !== documentId) {
    throw new DocumentError('SCAN_RESULT_ERROR', 'Scan result belongs to another document');
  }
  try {
    await repo.appendPages(db, documentId, scan.pages, Date.now());
  } catch (error) {
    for (const page of scan.pages) storage.deleteFile(page.processedPath);
    throw toDocumentError(error);
  }
  removeStalePdf(documentId);
}

export async function renameDocument(db: SQLiteDatabase, id: string, name: string) {
  const updated = await withDbErrors(() =>
    repo.renameDocument(db, id, normalizeDocumentName(name), Date.now()),
  );
  if (!updated) throw new DocumentError('DOCUMENT_NOT_FOUND', `Document ${id} does not exist`);
}

export async function deleteDocument(db: SQLiteDatabase, id: string): Promise<void> {
  await withDbErrors(() => repo.deleteDocument(db, id));
  storage.deleteDocumentFiles(id);
}

export async function deletePage(db: SQLiteDatabase, pageId: string): Promise<void> {
  const page = await withDbErrors(() => repo.deletePage(db, pageId, Date.now()));
  if (!page) return;
  storage.deleteFile(page.processedPath);
  if (page.originalPath) storage.deleteFile(page.originalPath);
  removeStalePdf(page.documentId);
}

export async function reorderPages(
  db: SQLiteDatabase,
  documentId: string,
  orderedPageIds: string[],
): Promise<void> {
  await withDbErrors(() => repo.reorderPages(db, documentId, orderedPageIds, Date.now()));
  removeStalePdf(documentId);
}

function removeStalePdf(documentId: string) {
  storage.deleteFile(storage.pdfRelativePath(documentId));
}

async function withDbErrors<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    throw toDocumentError(error, 'DATABASE_ERROR');
  }
}

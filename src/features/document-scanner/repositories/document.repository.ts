import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  DocumentPage,
  DocumentSummary,
  NewDocumentPage,
  ScannedDocument,
} from '../types/document';

/**
 * `updated_at` doubles as the optimistic-lock version for setPdfPath, so every write must
 * strictly increase it — even when two writes land in the same millisecond.
 */
const NEXT_UPDATED_AT = 'MAX(?, updated_at + 1)';

type DocumentRow = {
  id: string;
  name: string;
  pdf_path: string | null;
  page_count: number;
  created_at: number;
  updated_at: number;
};

type PageRow = {
  id: string;
  document_id: string;
  page_number: number;
  original_path: string | null;
  processed_path: string;
  is_blank: number | null;
  sharpness_score: number | null;
  created_at: number;
};

const toDocument = (row: DocumentRow): ScannedDocument => ({
  id: row.id,
  name: row.name,
  pdfPath: row.pdf_path,
  pageCount: row.page_count,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toPage = (row: PageRow): DocumentPage => ({
  id: row.id,
  documentId: row.document_id,
  pageNumber: row.page_number,
  originalPath: row.original_path,
  processedPath: row.processed_path,
  isBlank: row.is_blank === null ? null : row.is_blank === 1,
  sharpnessScore: row.sharpness_score,
  createdAt: row.created_at,
});

// ---------------------------------------------------------------- documents

export async function listDocuments(db: SQLiteDatabase): Promise<DocumentSummary[]> {
  const rows = await db.getAllAsync<DocumentRow & { cover_path: string | null }>(
    `SELECT d.*,
       (SELECT p.processed_path FROM document_pages p
        WHERE p.document_id = d.id ORDER BY p.page_number LIMIT 1) AS cover_path
     FROM documents d
     ORDER BY d.created_at DESC`,
  );
  return rows.map((row) => ({ ...toDocument(row), coverPath: row.cover_path }));
}

export async function listDocumentIds(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM documents');
  return rows.map((row) => row.id);
}

export async function getDocument(
  db: SQLiteDatabase,
  id: string,
): Promise<ScannedDocument | null> {
  const row = await db.getFirstAsync<DocumentRow>('SELECT * FROM documents WHERE id = ?', id);
  return row ? toDocument(row) : null;
}

export async function insertDocumentWithPages(
  db: SQLiteDatabase,
  document: Pick<ScannedDocument, 'id' | 'name' | 'pdfPath'>,
  pages: NewDocumentPage[],
  now: number,
): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `INSERT INTO documents (id, name, pdf_path, page_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      document.id,
      document.name,
      document.pdfPath,
      pages.length,
      now,
      now,
    );
    await insertPages(txn, document.id, pages, 1, now);
  });
}

export async function renameDocument(
  db: SQLiteDatabase,
  id: string,
  name: string,
  now: number,
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE documents SET name = ?, updated_at = ${NEXT_UPDATED_AT} WHERE id = ?`,
    name,
    now,
    id,
  );
  return result.changes > 0;
}

/**
 * Records a freshly generated PDF. Only applies if the document was not modified meanwhile
 * (optimistic check on updated_at); updated_at itself is left untouched because generating
 * a PDF does not change the document content.
 */
export async function setPdfPath(
  db: SQLiteDatabase,
  id: string,
  pdfPath: string,
  expectedUpdatedAt: number,
): Promise<boolean> {
  const result = await db.runAsync(
    'UPDATE documents SET pdf_path = ? WHERE id = ? AND updated_at = ?',
    pdfPath,
    id,
    expectedUpdatedAt,
  );
  return result.changes > 0;
}

/** Pages are removed by ON DELETE CASCADE. */
export async function deleteDocument(db: SQLiteDatabase, id: string): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM documents WHERE id = ?', id);
  return result.changes > 0;
}

// -------------------------------------------------------------------- pages

export async function listPages(db: SQLiteDatabase, documentId: string): Promise<DocumentPage[]> {
  const rows = await db.getAllAsync<PageRow>(
    'SELECT * FROM document_pages WHERE document_id = ? ORDER BY page_number ASC',
    documentId,
  );
  return rows.map(toPage);
}

/** Appends pages after the current last page. Invalidates the document PDF. */
export async function appendPages(
  db: SQLiteDatabase,
  documentId: string,
  pages: NewDocumentPage[],
  now: number,
): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    const last = await txn.getFirstAsync<{ max: number | null }>(
      'SELECT MAX(page_number) AS max FROM document_pages WHERE document_id = ?',
      documentId,
    );
    await insertPages(txn, documentId, pages, (last?.max ?? 0) + 1, now);
    await touchDocument(txn, documentId, now);
  });
}

/** Deletes one page and closes the numbering gap. Returns the deleted page, or null. */
export async function deletePage(
  db: SQLiteDatabase,
  pageId: string,
  now: number,
): Promise<DocumentPage | null> {
  let deleted: DocumentPage | null = null;

  await db.withExclusiveTransactionAsync(async (txn) => {
    const row = await txn.getFirstAsync<PageRow>('SELECT * FROM document_pages WHERE id = ?', pageId);
    if (!row) return;

    await txn.runAsync('DELETE FROM document_pages WHERE id = ?', pageId);
    // Two-step renumber (negate, then flip) so UNIQUE(document_id, page_number)
    // never sees a transient duplicate regardless of row update order.
    await txn.runAsync(
      `UPDATE document_pages SET page_number = -(page_number - 1)
       WHERE document_id = ? AND page_number > ?`,
      row.document_id,
      row.page_number,
    );
    await txn.runAsync(
      'UPDATE document_pages SET page_number = -page_number WHERE document_id = ? AND page_number < 0',
      row.document_id,
    );
    await touchDocument(txn, row.document_id, now);
    deleted = toPage(row);
  });

  return deleted;
}

/**
 * Sets the page order. `orderedPageIds` must contain exactly the document's page ids.
 * Invalidates the document PDF.
 */
export async function reorderPages(
  db: SQLiteDatabase,
  documentId: string,
  orderedPageIds: string[],
  now: number,
): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    const rows = await txn.getAllAsync<{ id: string }>(
      'SELECT id FROM document_pages WHERE document_id = ?',
      documentId,
    );
    const existing = new Set(rows.map((r) => r.id));
    const requested = new Set(orderedPageIds);
    const sameSet =
      existing.size === requested.size &&
      requested.size === orderedPageIds.length &&
      orderedPageIds.every((id) => existing.has(id));
    if (!sameSet) {
      throw new Error('Page order must contain every page of the document exactly once');
    }

    await txn.runAsync(
      'UPDATE document_pages SET page_number = -page_number WHERE document_id = ?',
      documentId,
    );
    for (const [index, id] of orderedPageIds.entries()) {
      await txn.runAsync(
        'UPDATE document_pages SET page_number = ? WHERE id = ? AND document_id = ?',
        index + 1,
        id,
        documentId,
      );
    }
    await touchDocument(txn, documentId, now);
  });
}

// ------------------------------------------------------------------ helpers

async function insertPages(
  txn: SQLiteDatabase,
  documentId: string,
  pages: NewDocumentPage[],
  firstPageNumber: number,
  now: number,
): Promise<void> {
  for (const [index, page] of pages.entries()) {
    await txn.runAsync(
      `INSERT INTO document_pages
         (id, document_id, page_number, original_path, processed_path, is_blank, sharpness_score, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`,
      page.id,
      documentId,
      firstPageNumber + index,
      page.originalPath,
      page.processedPath,
      now,
    );
  }
}

/**
 * Re-syncs the denormalised page_count and drops the PDF reference, because any page
 * change makes the stored PDF stale (it is regenerated in Phase 4).
 */
async function touchDocument(txn: SQLiteDatabase, documentId: string, now: number) {
  await txn.runAsync(
    `UPDATE documents
     SET page_count = (SELECT COUNT(*) FROM document_pages WHERE document_id = ?),
         pdf_path = NULL,
         updated_at = ${NEXT_UPDATED_AT}
     WHERE id = ?`,
    documentId,
    now,
    documentId,
  );
}

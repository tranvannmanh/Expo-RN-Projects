import type { SQLiteDatabase } from 'expo-sqlite';

import { createMigratedDatabase, pageOrder } from '../../../../jest/fixtures';
import * as repo from '../repositories/document.repository';
import type { NewDocumentPage } from '../types/document';

const T0 = 1_000;
const T1 = 2_000;

const pages = (docId: string, ...names: string[]): NewDocumentPage[] =>
  names.map((name) => ({
    id: `${docId}:${name}`,
    processedPath: `documents/${docId}/processed/${name}.jpg`,
    originalPath: null,
  }));

async function seed(db: SQLiteDatabase, id = 'doc', names = ['p1', 'p2', 'p3']) {
  await repo.insertDocumentWithPages(
    db,
    { id, name: 'Doc', pdfPath: `documents/${id}/document.pdf` },
    pages(id, ...names),
    T0,
  );
}

describe('document.repository', () => {
  let db: Awaited<ReturnType<typeof createMigratedDatabase>>;

  beforeEach(async () => {
    db = await createMigratedDatabase();
  });
  afterEach(() => db.close());

  describe('create + read', () => {
    it('inserts a document with numbered pages', async () => {
      await seed(db);

      const document = await repo.getDocument(db, 'doc');
      expect(document).toEqual({
        id: 'doc',
        name: 'Doc',
        pdfPath: 'documents/doc/document.pdf',
        pageCount: 3,
        createdAt: T0,
        updatedAt: T0,
      });
      const stored = await repo.listPages(db, 'doc');
      expect(stored.map((p) => p.pageNumber)).toEqual([1, 2, 3]);
      expect(stored[0]).toMatchObject({ isBlank: null, sharpnessScore: null, originalPath: null });
    });

    it('lists newest first with the first page as cover', async () => {
      await repo.insertDocumentWithPages(db, { id: 'old', name: 'Old', pdfPath: null }, pages('old', 'a'), T0);
      await repo.insertDocumentWithPages(db, { id: 'new', name: 'New', pdfPath: null }, pages('new', 'b', 'c'), T1);

      const list = await repo.listDocuments(db);
      expect(list.map((d) => d.id)).toEqual(['new', 'old']);
      expect(list[0].coverPath).toBe('documents/new/processed/b.jpg');
    });

    it('returns null for an unknown document', async () => {
      expect(await repo.getDocument(db, 'missing')).toBeNull();
    });
  });

  describe('transactions', () => {
    it('rolls back the document row when a page insert fails', async () => {
      const duplicate = [...pages('doc', 'p1'), ...pages('doc', 'p1')];
      await expect(
        repo.insertDocumentWithPages(db, { id: 'doc', name: 'Doc', pdfPath: null }, duplicate, T0),
      ).rejects.toThrow(/UNIQUE/);

      expect(await repo.getDocument(db, 'doc')).toBeNull();
      expect(await repo.listPages(db, 'doc')).toEqual([]);
    });

    it('rejects pages for a non-existent document (foreign key)', async () => {
      await expect(repo.appendPages(db, 'ghost', pages('ghost', 'x'), T1)).rejects.toThrow(/FOREIGN KEY/);
    });
  });

  describe('appendPages', () => {
    it('continues numbering, updates page_count and invalidates the PDF', async () => {
      await seed(db);
      await repo.appendPages(db, 'doc', pages('doc', 'p4', 'p5'), T1);

      expect(await pageOrder(db, 'doc')).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
      expect(await repo.getDocument(db, 'doc')).toMatchObject({ pageCount: 5, pdfPath: null, updatedAt: T1 });
    });
  });

  describe('deletePage', () => {
    it('removes the page and closes the numbering gap', async () => {
      await seed(db, 'doc', ['p1', 'p2', 'p3', 'p4']);

      const deleted = await repo.deletePage(db, 'doc:p2', T1);

      expect(deleted?.processedPath).toBe('documents/doc/processed/p2.jpg');
      const stored = await repo.listPages(db, 'doc');
      expect(stored.map((p) => [p.id, p.pageNumber])).toEqual([
        ['doc:p1', 1],
        ['doc:p3', 2],
        ['doc:p4', 3],
      ]);
      expect(await repo.getDocument(db, 'doc')).toMatchObject({ pageCount: 3, pdfPath: null });
    });

    it('returns null and changes nothing for an unknown page', async () => {
      await seed(db);
      expect(await repo.deletePage(db, 'doc:nope', T1)).toBeNull();
      expect(await repo.getDocument(db, 'doc')).toMatchObject({ pageCount: 3, updatedAt: T0 });
    });
  });

  describe('reorderPages', () => {
    it('applies the new order and invalidates the PDF', async () => {
      await seed(db);
      await repo.reorderPages(db, 'doc', ['doc:p3', 'doc:p1', 'doc:p2'], T1);

      expect(await pageOrder(db, 'doc')).toEqual(['p3', 'p1', 'p2']);
      expect(await repo.getDocument(db, 'doc')).toMatchObject({ pdfPath: null, updatedAt: T1 });
    });

    it.each([
      ['a missing page', ['doc:p1', 'doc:p2']],
      ['a duplicate page', ['doc:p1', 'doc:p1', 'doc:p2']],
      ['a foreign page', ['doc:p1', 'doc:p2', 'other:p3']],
    ])('rejects an order with %s and keeps the old order', async (_, order) => {
      await seed(db);
      await expect(repo.reorderPages(db, 'doc', order, T1)).rejects.toThrow(/exactly once/);
      expect(await pageOrder(db, 'doc')).toEqual(['p1', 'p2', 'p3']);
      expect(await repo.getDocument(db, 'doc')).toMatchObject({ pdfPath: 'documents/doc/document.pdf' });
    });
  });

  describe('rename + delete', () => {
    it('renames and reports whether a row changed', async () => {
      await seed(db);
      expect(await repo.renameDocument(db, 'doc', 'Renamed', T1)).toBe(true);
      expect(await repo.renameDocument(db, 'missing', 'X', T1)).toBe(false);
      expect(await repo.getDocument(db, 'doc')).toMatchObject({ name: 'Renamed', updatedAt: T1 });
    });

    it('deletes pages through ON DELETE CASCADE', async () => {
      await seed(db);
      expect(await repo.deleteDocument(db, 'doc')).toBe(true);
      const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM document_pages');
      expect(count?.n).toBe(0);
    });
  });

  describe('setPdfPath', () => {
    it('detects a change made in the same millisecond as the read', async () => {
      await seed(db);
      const before = await repo.getDocument(db, 'doc');
      // Same timestamp as creation: updated_at must still move forward.
      await repo.reorderPages(db, 'doc', ['doc:p2', 'doc:p1', 'doc:p3'], T0);

      expect(await repo.setPdfPath(db, 'doc', 'documents/doc/document.pdf', before!.updatedAt)).toBe(false);
    });

    it('only records the PDF if the document was not modified meanwhile', async () => {
      await seed(db);
      await repo.appendPages(db, 'doc', pages('doc', 'p4'), T1);

      expect(await repo.setPdfPath(db, 'doc', 'documents/doc/document.pdf', T0)).toBe(false);
      expect((await repo.getDocument(db, 'doc'))?.pdfPath).toBeNull();

      expect(await repo.setPdfPath(db, 'doc', 'documents/doc/document.pdf', T1)).toBe(true);
      expect(await repo.getDocument(db, 'doc')).toMatchObject({
        pdfPath: 'documents/doc/document.pdf',
        updatedAt: T1,
      });
    });
  });

  it('handles a 50-page document', async () => {
    const names = Array.from({ length: 50 }, (_, i) => `p${i + 1}`);
    await seed(db, 'big', names);
    const reversed = [...names].reverse().map((n) => `big:${n}`);

    await repo.reorderPages(db, 'big', reversed, T1);
    await repo.deletePage(db, 'big:p25', T1);

    const stored = await repo.listPages(db, 'big');
    expect(stored).toHaveLength(49);
    expect(stored.map((p) => p.pageNumber)).toEqual(Array.from({ length: 49 }, (_, i) => i + 1));
    expect(stored[0].id).toBe('big:p50');
  });
});

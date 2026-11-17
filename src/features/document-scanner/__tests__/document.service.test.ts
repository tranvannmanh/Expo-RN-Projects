import { createMigratedDatabase, fakeScan, pageOrder } from '../../../../jest/fixtures';
import { File, memoryFs } from '../../../../jest/mocks/expoFileSystem';
import * as repo from '../repositories/document.repository';
import * as service from '../services/document.service';

describe('document.service', () => {
  let db: Awaited<ReturnType<typeof createMigratedDatabase>>;

  beforeEach(async () => {
    db = await createMigratedDatabase();
  });
  afterEach(() => db.close());

  describe('createDocumentFromScan', () => {
    it('persists a scan as a document with ordered pages', async () => {
      const created = await service.createDocumentFromScan(db, '  Lease   2026 ', fakeScan('doc', 3));

      expect(created).toMatchObject({ id: 'doc', name: 'Lease 2026', pageCount: 3, pdfPath: 'documents/doc/document.pdf' });
      expect(await pageOrder(db, 'doc')).toEqual(['page_scan1_001', 'page_scan1_002', 'page_scan1_003']);
    });

    it('deletes the scanned files when the document cannot be saved', async () => {
      await expect(service.createDocumentFromScan(db, '   ', fakeScan('doc', 2))).rejects.toMatchObject({
        code: 'INVALID_INPUT',
      });
      expect(memoryFs.list()).toEqual([]);
      expect(await repo.getDocument(db, 'doc')).toBeNull();
    });

    it('rejects an invalid scan result without touching the database', async () => {
      await expect(service.createDocumentFromScan(db, 'X', { cancelled: true })).rejects.toMatchObject({
        code: 'SCAN_RESULT_ERROR',
      });
      expect(await repo.listDocuments(db)).toEqual([]);
    });
  });

  describe('addPagesFromScan', () => {
    it('appends pages and removes the stale PDF file', async () => {
      await service.createDocumentFromScan(db, 'Doc', fakeScan('doc', 2));
      await service.addPagesFromScan(db, 'doc', fakeScan('doc', 1, { scanId: 'scan2', withPdf: false }));

      expect(await pageOrder(db, 'doc')).toEqual(['page_scan1_001', 'page_scan1_002', 'page_scan2_001']);
      expect(memoryFs.exists('documents/doc/document.pdf')).toBe(false);
      expect((await repo.getDocument(db, 'doc'))?.pdfPath).toBeNull();
    });

    it('deletes only the new page files when the insert fails', async () => {
      // Document row does not exist → foreign key violation.
      fakeScan('ghost', 1, { scanId: 'old', withPdf: false });
      const scan = fakeScan('ghost', 2, { scanId: 'new', withPdf: false });

      await expect(service.addPagesFromScan(db, 'ghost', scan)).rejects.toMatchObject({ code: 'DATABASE_ERROR' });
      expect(memoryFs.list()).toEqual(['documents/ghost/processed/page_old_001.jpg']);
    });

    it('refuses a scan that belongs to another document', async () => {
      await service.createDocumentFromScan(db, 'Doc', fakeScan('doc', 1));
      await expect(service.addPagesFromScan(db, 'doc', fakeScan('other', 1))).rejects.toMatchObject({
        code: 'SCAN_RESULT_ERROR',
      });
    });
  });

  describe('deletion', () => {
    it('deleteDocument removes rows and the whole folder', async () => {
      await service.createDocumentFromScan(db, 'Keep', fakeScan('keep', 1));
      await service.createDocumentFromScan(db, 'Doc', fakeScan('doc', 2));

      await service.deleteDocument(db, 'doc');

      expect(await repo.getDocument(db, 'doc')).toBeNull();
      expect(memoryFs.list().every((path) => path.startsWith('documents/keep/'))).toBe(true);
    });

    it('deletePage removes the image and the stale PDF', async () => {
      await service.createDocumentFromScan(db, 'Doc', fakeScan('doc', 3));

      await service.deletePage(db, 'doc:page_scan1_002');

      expect(memoryFs.list()).toEqual([
        'documents/doc/processed/page_scan1_001.jpg',
        'documents/doc/processed/page_scan1_003.jpg',
      ]);
      expect(await repo.getDocument(db, 'doc')).toMatchObject({ pageCount: 2, pdfPath: null });
    });

    it('deletePage tolerates a page file that is already missing', async () => {
      await service.createDocumentFromScan(db, 'Doc', fakeScan('doc', 2));
      new File(`${memoryFs.root}documents/doc/processed/page_scan1_001.jpg`).delete();

      await expect(service.deletePage(db, 'doc:page_scan1_001')).resolves.toBeUndefined();
      expect(await pageOrder(db, 'doc')).toEqual(['page_scan1_002']);
    });
  });

  it('reorderPages invalidates the PDF', async () => {
    await service.createDocumentFromScan(db, 'Doc', fakeScan('doc', 2));
    await service.reorderPages(db, 'doc', ['doc:page_scan1_002', 'doc:page_scan1_001']);

    expect(await pageOrder(db, 'doc')).toEqual(['page_scan1_002', 'page_scan1_001']);
    expect(memoryFs.exists('documents/doc/document.pdf')).toBe(false);
  });

  it('renameDocument validates input and existence', async () => {
    await service.createDocumentFromScan(db, 'Doc', fakeScan('doc', 1));

    await service.renameDocument(db, 'doc', 'New name');
    expect((await repo.getDocument(db, 'doc'))?.name).toBe('New name');
    await expect(service.renameDocument(db, 'doc', ' ')).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await expect(service.renameDocument(db, 'nope', 'X')).rejects.toMatchObject({ code: 'DOCUMENT_NOT_FOUND' });
  });

  it('normalizeDocumentName trims, collapses whitespace and caps the length', () => {
    expect(service.normalizeDocumentName('  a \n  b  ')).toBe('a b');
    expect(service.normalizeDocumentName('x'.repeat(500))).toHaveLength(service.MAX_NAME_LENGTH);
  });

  describe('reconcileStorage (app restart recovery)', () => {
    /** Fresh module instance = fresh app process (reconciliation state is per process). */
    const freshService = () => {
      let isolated = service;
      jest.isolateModules(() => {
        isolated = jest.requireActual<typeof service>('../services/document.service');
      });
      return isolated;
    };

    it('removes folders without a database row and keeps known ones', async () => {
      const isolated = freshService();
      {
        await isolated.createDocumentFromScan(db, 'Doc', fakeScan('doc', 1));
        fakeScan('orphan', 2); // e.g. app killed between native copy and DB insert

        const report = await isolated.reconcileStorage(db);

        expect(report.removedFolders).toEqual(['orphan']);
        expect(memoryFs.list().every((path) => path.startsWith('documents/doc/'))).toBe(true);
      }
    });

    it('clears leftover share copies from the cache', async () => {
      const isolated = freshService();
      memoryFs.writeCache('share/Old.pdf');

      await isolated.reconcileStorage(db);

      expect(memoryFs.cacheFiles()).toEqual([]);
    });

    it('runs once per app process', async () => {
      const isolated = freshService();
      {
        await isolated.reconcileStorage(db);
        fakeScan('created-later', 1);

        expect((await isolated.reconcileStorage(db)).removedFolders).toEqual([]);
        expect(memoryFs.exists('documents/created-later/processed/page_scan1_001.jpg')).toBe(true);
      }
    });
  });
});

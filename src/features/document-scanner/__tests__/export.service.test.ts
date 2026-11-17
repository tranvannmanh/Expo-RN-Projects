import * as Sharing from 'expo-sharing';

import { createMigratedDatabase, fakeScan } from '../../../../jest/fixtures';
import { File, memoryFs } from '../../../../jest/mocks/expoFileSystem';
import { nativeError, nativeScanner } from '../../../../jest/mocks/nativeScanner';
import * as repo from '../repositories/document.repository';
import { createDocumentFromScan, reorderPages } from '../services/document.service';
import * as exporter from '../services/export.service';

const PDF = 'documents/doc/document.pdf';
const pageUri = (n: number) => `${memoryFs.root}documents/doc/processed/page_scan1_00${n}.jpg`;

/** Native generatePdfAsync stand-in: writes the PDF file and returns its URI. */
function nativeWritesPdf() {
  nativeScanner.generatePdfAsync.mockImplementation(async (documentId: string) => {
    memoryFs.write(`documents/${documentId}/document.pdf`, 'pdf');
    return `${memoryFs.root}documents/${documentId}/document.pdf`;
  });
}

describe('export.service', () => {
  let db: Awaited<ReturnType<typeof createMigratedDatabase>>;

  beforeEach(async () => {
    db = await createMigratedDatabase();
    nativeWritesPdf();
  });
  afterEach(() => db.close());

  describe('ensurePdf', () => {
    it('reuses an up-to-date PDF without calling native', async () => {
      await createDocumentFromScan(db, 'Doc', fakeScan('doc', 2));

      await expect(exporter.ensurePdf(db, 'doc')).resolves.toBe(PDF);
      expect(nativeScanner.generatePdfAsync).not.toHaveBeenCalled();
    });

    it('regenerates from the current page order after a change and records it', async () => {
      await createDocumentFromScan(db, 'Doc', fakeScan('doc', 3));
      await reorderPages(db, 'doc', ['doc:page_scan1_003', 'doc:page_scan1_001', 'doc:page_scan1_002']);

      await expect(exporter.ensurePdf(db, 'doc')).resolves.toBe(PDF);

      expect(nativeScanner.generatePdfAsync).toHaveBeenCalledWith('doc', [pageUri(3), pageUri(1), pageUri(2)]);
      expect((await repo.getDocument(db, 'doc'))?.pdfPath).toBe(PDF);
    });

    it('regenerates when the recorded PDF file is gone', async () => {
      await createDocumentFromScan(db, 'Doc', fakeScan('doc', 1));
      new File(`${memoryFs.root}${PDF}`).delete();

      await exporter.ensurePdf(db, 'doc');
      expect(nativeScanner.generatePdfAsync).toHaveBeenCalledTimes(1);
    });

    it('does not record a PDF that went stale while it was being built', async () => {
      await createDocumentFromScan(db, 'Doc', fakeScan('doc', 2, { withPdf: false }));
      nativeScanner.generatePdfAsync.mockImplementation(async () => {
        // User reorders pages while the native build runs.
        await reorderPages(db, 'doc', ['doc:page_scan1_002', 'doc:page_scan1_001']);
        memoryFs.write(PDF, 'pdf');
        return `${memoryFs.root}${PDF}`;
      });

      await exporter.ensurePdf(db, 'doc');

      expect((await repo.getDocument(db, 'doc'))?.pdfPath).toBeNull();
    });

    it('shares one build between concurrent calls', async () => {
      await createDocumentFromScan(db, 'Doc', fakeScan('doc', 2, { withPdf: false }));

      const results = await Promise.all([exporter.ensurePdf(db, 'doc'), exporter.ensurePdf(db, 'doc')]);

      expect(results).toEqual([PDF, PDF]);
      expect(nativeScanner.generatePdfAsync).toHaveBeenCalledTimes(1);
    });

    it('fails with FILE_NOT_FOUND naming the missing pages, without calling native', async () => {
      await createDocumentFromScan(db, 'Doc', fakeScan('doc', 3, { withPdf: false }));
      new File(pageUri(2)).delete();

      await expect(exporter.ensurePdf(db, 'doc')).rejects.toMatchObject({
        code: 'FILE_NOT_FOUND',
        message: expect.stringContaining('Pages 2'),
      });
      expect(nativeScanner.generatePdfAsync).not.toHaveBeenCalled();
    });

    it('passes native error codes through', async () => {
      await createDocumentFromScan(db, 'Doc', fakeScan('doc', 1, { withPdf: false }));
      nativeScanner.generatePdfAsync.mockRejectedValue(nativeError('STORAGE_FULL'));

      await expect(exporter.ensurePdf(db, 'doc')).rejects.toMatchObject({ code: 'STORAGE_FULL' });
      // The failed build is not cached: a retry calls native again.
      nativeWritesPdf();
      await expect(exporter.ensurePdf(db, 'doc')).resolves.toBe(PDF);
    });

    it('fails with DOCUMENT_NOT_FOUND for an unknown document', async () => {
      await expect(exporter.ensurePdf(db, 'nope')).rejects.toMatchObject({ code: 'DOCUMENT_NOT_FOUND' });
    });
  });

  describe('PDF export', () => {
    beforeEach(async () => {
      await createDocumentFromScan(db, 'Lease: 2026/v2', fakeScan('doc', 1));
    });

    it('saves to Documents/ScannerApp with a sanitised file name', async () => {
      nativeScanner.saveToPublicFolderAsync.mockResolvedValue({
        uri: 'content://media/1',
        displayPath: 'Documents/ScannerApp/Lease_ 2026_v2.pdf',
      });

      const result = await exporter.savePdfToDocuments(db, 'doc');

      expect(nativeScanner.saveToPublicFolderAsync).toHaveBeenCalledWith(
        `${memoryFs.root}${PDF}`,
        'Lease_ 2026_v2.pdf',
        'application/pdf',
        'documents',
      );
      expect(result.displayPath).toBe('Documents/ScannerApp/Lease_ 2026_v2.pdf');
    });

    it('maps native export failures to their codes', async () => {
      nativeScanner.saveToPublicFolderAsync.mockRejectedValue(nativeError('EXPORT_UNSUPPORTED'));
      await expect(exporter.savePdfToDocuments(db, 'doc')).rejects.toMatchObject({ code: 'EXPORT_UNSUPPORTED' });
    });

    it('returns a cancelled picker result as-is', async () => {
      nativeScanner.saveWithPickerAsync.mockResolvedValue({ cancelled: true });
      await expect(exporter.savePdfWithPicker(db, 'doc')).resolves.toEqual({ cancelled: true });
    });

    it('keeps the private PDF after exporting', async () => {
      nativeScanner.saveToPublicFolderAsync.mockResolvedValue({ uri: 'content://x', displayPath: 'x' });
      await exporter.savePdfToDocuments(db, 'doc');
      expect(memoryFs.exists(PDF)).toBe(true);
    });

    it('shares a readable copy from the cache and keeps the original', async () => {
      await exporter.sharePdf(db, 'doc');

      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringMatching(/\/cache\/share\/Lease_ 2026_v2\.pdf$/),
        expect.objectContaining({ mimeType: 'application/pdf' }),
      );
      expect(memoryFs.cacheFiles()).toEqual(['share/Lease_ 2026_v2.pdf']);
      expect(memoryFs.exists(PDF)).toBe(true);
    });

    it('fails with SHARE_UNAVAILABLE when the platform cannot share', async () => {
      jest.mocked(Sharing.isAvailableAsync).mockResolvedValueOnce(false);
      await expect(exporter.sharePdf(db, 'doc')).rejects.toMatchObject({ code: 'SHARE_UNAVAILABLE' });
    });
  });

  describe('page export', () => {
    const page = { id: 'doc:page_scan1_001', pageNumber: 1, uri: pageUri(1), missing: false };

    beforeEach(() => {
      fakeScan('doc', 1, { withPdf: false });
    });

    it('saves a page to Pictures/ScannerApp', async () => {
      nativeScanner.saveToPublicFolderAsync.mockResolvedValue({ uri: 'content://x', displayPath: 'Pictures/ScannerApp/x.jpg' });

      await exporter.savePageToPictures('Lease', page);

      expect(nativeScanner.saveToPublicFolderAsync).toHaveBeenCalledWith(
        pageUri(1),
        'Lease - page 1.jpg',
        'image/jpeg',
        'pictures',
      );
    });

    it('fails with FILE_NOT_FOUND when sharing a page whose file is missing', async () => {
      new File(pageUri(1)).delete();
      await expect(exporter.sharePage('Lease', page)).rejects.toMatchObject({ code: 'FILE_NOT_FOUND' });
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });
  });

  it.each([
    ['a/b:c*d?e"f<g>h|i', 'a_b_c_d_e_f_g_h_i'],
    ['  many   spaces  ', 'many spaces'],
    ['///', '___'],
    ['', 'document'],
    ['x'.repeat(300), 'x'.repeat(100)],
  ])('exportBaseName(%j) → %j', (input, expected) => {
    expect(exporter.exportBaseName(input)).toBe(expected);
  });
});

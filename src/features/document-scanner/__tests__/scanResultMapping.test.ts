import { memoryFs } from '../../../../jest/mocks/expoFileSystem';
import { DocumentError } from '../types/errors';
import { mapScanResult } from '../utils/scanResultMapping';

const uri = (relative: string) => `${memoryFs.root}${relative}`;

describe('mapScanResult', () => {
  it('maps native file URIs to relative paths, sorted by page number', () => {
    const mapped = mapScanResult({
      cancelled: false,
      documentId: 'doc',
      pdfUri: uri('documents/doc/document.pdf'),
      pages: [
        { pageNumber: 2, uri: uri('documents/doc/processed/page_s_002.jpg') },
        { pageNumber: 1, uri: uri('documents/doc/processed/page_s_001.jpg') },
      ],
    });

    expect(mapped).toEqual({
      documentId: 'doc',
      pdfPath: 'documents/doc/document.pdf',
      pages: [
        { id: 'doc:page_s_001', processedPath: 'documents/doc/processed/page_s_001.jpg', originalPath: null },
        { id: 'doc:page_s_002', processedPath: 'documents/doc/processed/page_s_002.jpg', originalPath: null },
      ],
    });
  });

  it('keeps pdfPath null when no PDF was produced', () => {
    const mapped = mapScanResult({
      cancelled: false,
      documentId: 'doc',
      pdfUri: null,
      pages: [{ pageNumber: 1, uri: uri('documents/doc/processed/a.jpg') }],
    });
    expect(mapped.pdfPath).toBeNull();
  });

  it.each([
    ['a cancelled result', { cancelled: true }],
    ['a result without pages', { cancelled: false, documentId: 'doc', pages: [] }],
    ['a result without documentId', { cancelled: false, pages: [{ pageNumber: 1, uri: uri('documents/x/a.jpg') }] }],
  ])('rejects %s with SCAN_RESULT_ERROR', (_, result) => {
    expect(() => mapScanResult(result)).toThrow(DocumentError);
    expect(() => mapScanResult(result)).toThrow(expect.objectContaining({ code: 'SCAN_RESULT_ERROR' }));
  });

  it('rejects URIs outside the documents folder', () => {
    expect(() =>
      mapScanResult({
        cancelled: false,
        documentId: 'doc',
        pages: [{ pageNumber: 1, uri: 'file:///sdcard/Download/evil.jpg' }],
      }),
    ).toThrow(/Not an app document file/);
  });
});

import {
  DocumentScannerError,
  SCANNER_ERROR_CODES,
  scanDocument,
  toDocumentScannerError,
} from '@modules/document-scanner';

import { nativeError, nativeScanner } from '../../../../jest/mocks/nativeScanner';

import { DocumentError, toDocumentError } from '../types/errors';
import { documentErrorMessage } from '../utils/documentErrorMessage';

describe('toDocumentScannerError', () => {
  it('keeps known native codes', () => {
    const error = toDocumentScannerError(nativeError('STORAGE_FULL', 'disk full'));
    expect(error).toBeInstanceOf(DocumentScannerError);
    expect(error).toMatchObject({ code: 'STORAGE_FULL', message: 'disk full' });
  });

  it('maps unknown codes and non-errors to SCAN_RESULT_ERROR, keeping the cause', () => {
    const raw = nativeError('ERR_SOMETHING_NEW');
    expect(toDocumentScannerError(raw)).toMatchObject({ code: 'SCAN_RESULT_ERROR', cause: raw });
    expect(toDocumentScannerError('boom')).toMatchObject({ code: 'SCAN_RESULT_ERROR', message: 'boom' });
  });
});

describe('scanDocument (JS wrapper)', () => {
  it('passes options through and returns the native result', async () => {
    nativeScanner.scanDocumentAsync.mockResolvedValue({ cancelled: true });
    await expect(scanDocument({ pageLimit: 5 })).resolves.toEqual({ cancelled: true });
    expect(nativeScanner.scanDocumentAsync).toHaveBeenCalledWith({ pageLimit: 5 });
  });

  it('converts native rejections into DocumentScannerError', async () => {
    nativeScanner.scanDocumentAsync.mockRejectedValue(nativeError('SCAN_IN_PROGRESS'));
    await expect(scanDocument()).rejects.toMatchObject({ name: 'DocumentScannerError', code: 'SCAN_IN_PROGRESS' });
  });
});

describe('toDocumentError', () => {
  it('wraps scanner errors with the same code', () => {
    const scannerError = new DocumentScannerError('FILE_COPY_ERROR', 'copy failed');
    expect(toDocumentError(scannerError)).toMatchObject({ code: 'FILE_COPY_ERROR', cause: scannerError });
  });

  it('uses the fallback code for unknown errors', () => {
    expect(toDocumentError(new Error('SQLITE_BUSY'))).toMatchObject({ code: 'DATABASE_ERROR' });
    expect(toDocumentError(new Error('x'), 'PDF_EXPORT_ERROR').code).toBe('PDF_EXPORT_ERROR');
  });

  it('returns DocumentError instances unchanged', () => {
    const error = new DocumentError('INVALID_INPUT', 'empty');
    expect(toDocumentError(error)).toBe(error);
  });
});

describe('documentErrorMessage', () => {
  it('has a user-facing message for every scanner error code', () => {
    for (const code of SCANNER_ERROR_CODES) {
      expect(documentErrorMessage(code)).toEqual(expect.any(String));
    }
  });
});

import { DocumentScannerError, type ScannerErrorCode } from '@modules/document-scanner';

export type DocumentErrorCode =
  | ScannerErrorCode
  | 'SCAN_CANCELLED'
  | 'INVALID_INPUT'
  | 'DOCUMENT_NOT_FOUND'
  | 'DATABASE_ERROR'
  | 'PDF_EXPORT_ERROR'
  | 'SHARE_UNAVAILABLE';

/** Single error type surfaced to the UI for every document operation. */
export class DocumentError extends Error {
  readonly code: DocumentErrorCode;
  readonly cause?: unknown;

  constructor(code: DocumentErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'DocumentError';
    this.code = code;
    this.cause = cause;
  }
}

/** Normalises any thrown value; unknown errors fall back to `fallbackCode`. */
export function toDocumentError(
  error: unknown,
  fallbackCode: DocumentErrorCode = 'DATABASE_ERROR',
): DocumentError {
  if (error instanceof DocumentError) return error;
  if (error instanceof DocumentScannerError) {
    return new DocumentError(error.code, error.message, error);
  }
  const message = error instanceof Error ? error.message : String(error);
  return new DocumentError(fallbackCode, message, error);
}

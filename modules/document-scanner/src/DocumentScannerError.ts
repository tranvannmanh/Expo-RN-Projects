import { SCANNER_ERROR_CODES, type ScannerErrorCode } from './DocumentScanner.types';

export class DocumentScannerError extends Error {
  readonly code: ScannerErrorCode;
  readonly cause?: unknown;

  constructor(code: ScannerErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'DocumentScannerError';
    this.code = code;
    this.cause = cause;
  }
}

function isScannerErrorCode(value: unknown): value is ScannerErrorCode {
  return (
    typeof value === 'string' && (SCANNER_ERROR_CODES as readonly string[]).includes(value)
  );
}

/** Converts a rejected native promise into a typed DocumentScannerError. */
export function toDocumentScannerError(error: unknown): DocumentScannerError {
  if (error instanceof DocumentScannerError) return error;

  const code = (error as { code?: unknown } | null)?.code;
  const message = error instanceof Error ? error.message : String(error);

  return new DocumentScannerError(
    isScannerErrorCode(code) ? code : 'SCAN_RESULT_ERROR',
    message,
    error,
  );
}

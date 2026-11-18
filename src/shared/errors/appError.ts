import { DocumentScannerError, type ScannerErrorCode } from '@modules/document-scanner';
import { PdfToolsError, type PdfToolsErrorCode } from '@modules/pdf-tools';

export type AppErrorCode =
  | ScannerErrorCode
  | PdfToolsErrorCode
  | 'SCAN_CANCELLED'
  | 'INVALID_INPUT'
  | 'DOCUMENT_NOT_FOUND'
  | 'DATABASE_ERROR'
  | 'PDF_EXPORT_ERROR'
  | 'SHARE_UNAVAILABLE'
  | 'NOT_REDUCED';

/** Single error type surfaced to the UI by every feature (scanner, PDF tools, …). */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly cause?: unknown;

  constructor(code: AppErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}

/** Normalises any thrown value; native module errors keep their code. */
export function toAppError(error: unknown, fallbackCode: AppErrorCode = 'DATABASE_ERROR'): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof DocumentScannerError || error instanceof PdfToolsError) {
    return new AppError(error.code, error.message, error);
  }
  const message = error instanceof Error ? error.message : String(error);
  return new AppError(fallbackCode, message, error);
}

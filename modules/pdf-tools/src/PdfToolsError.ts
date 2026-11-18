import { PDF_TOOLS_ERROR_CODES, type PdfToolsErrorCode } from './PdfTools.types';

export class PdfToolsError extends Error {
  readonly code: PdfToolsErrorCode;
  readonly cause?: unknown;

  constructor(code: PdfToolsErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'PdfToolsError';
    this.code = code;
    this.cause = cause;
  }
}

const isPdfToolsErrorCode = (value: unknown): value is PdfToolsErrorCode =>
  typeof value === 'string' && (PDF_TOOLS_ERROR_CODES as readonly string[]).includes(value);

export function toPdfToolsError(error: unknown): PdfToolsError {
  if (error instanceof PdfToolsError) return error;
  const code = (error as { code?: unknown } | null)?.code;
  const message = error instanceof Error ? error.message : String(error);
  return new PdfToolsError(isPdfToolsErrorCode(code) ? code : 'PDF_OPERATION_ERROR', message, error);
}

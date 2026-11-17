package expo.modules.documentscanner

import expo.modules.kotlin.exception.CodedException

/**
 * Error codes shared with TypeScript (`modules/document-scanner/src/DocumentScanner.types.ts`).
 * Keep both lists in sync.
 */
internal enum class ScannerErrorCode {
  SCAN_IN_PROGRESS,
  SCANNER_UNAVAILABLE,
  SCAN_INIT_ERROR,
  SCAN_LAUNCH_ERROR,
  SCAN_RESULT_ERROR,
  FILE_COPY_ERROR,
  FILE_NOT_FOUND,
  STORAGE_FULL,
  PDF_EXPORT_ERROR,
  EXPORT_ERROR,
  EXPORT_UNSUPPORTED,
  EXPORT_IN_PROGRESS,
}

internal class DocumentScannerException(
  code: ScannerErrorCode,
  message: String,
  cause: Throwable? = null,
) : CodedException(code.name, message, cause)

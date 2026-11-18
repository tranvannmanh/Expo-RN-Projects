package expo.modules.pdftools

import expo.modules.kotlin.exception.CodedException

/** Keep in sync with PDF_TOOLS_ERROR_CODES in modules/pdf-tools/src/PdfTools.types.ts. */
internal enum class PdfToolsErrorCode {
  PDF_INVALID,
  PDF_PASSWORD_PROTECTED,
  PDF_OPERATION_ERROR,
  INVALID_PAGE_RANGE,
  FILE_NOT_FOUND,
  STORAGE_FULL,
  IMPORT_ERROR,
  PICKER_IN_PROGRESS,
}

internal class PdfToolsException(
  code: PdfToolsErrorCode,
  message: String,
  cause: Throwable? = null,
) : CodedException(code.name, message, cause)

import type { DocumentErrorCode } from '../types/errors';

const MESSAGES: Record<DocumentErrorCode, string> = {
  SCAN_CANCELLED: 'Scan cancelled. Nothing was saved.',
  SCAN_IN_PROGRESS: 'A scan is already running.',
  SCANNER_UNAVAILABLE:
    'The document scanner is not available. Make sure Google Play services is installed and up to date.',
  SCAN_INIT_ERROR: 'The scanner could not be started. Please try again.',
  SCAN_LAUNCH_ERROR: 'The scanner could not be opened. Please try again.',
  SCAN_RESULT_ERROR: 'The scan result could not be read. Please scan again.',
  FILE_COPY_ERROR: 'The scanned pages could not be saved.',
  FILE_NOT_FOUND: 'Some files of this document are missing.',
  STORAGE_FULL: 'Not enough storage space. Free up space and try again.',
  INVALID_INPUT: 'Please check the entered value and try again.',
  DOCUMENT_NOT_FOUND: 'This document no longer exists.',
  DATABASE_ERROR: 'The document could not be saved. Please try again.',
  PDF_EXPORT_ERROR: 'The PDF could not be created.',
  EXPORT_ERROR: 'The file could not be saved to the selected location.',
  EXPORT_UNSUPPORTED: 'Saving to shared folders needs Android 10 or later. Use “Choose location” instead.',
  EXPORT_IN_PROGRESS: 'An export is already running.',
  SHARE_UNAVAILABLE: 'Sharing is not available on this device.',
};

export function documentErrorMessage(code: DocumentErrorCode): string {
  return MESSAGES[code];
}

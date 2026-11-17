/** Keep in sync with `ScannerErrorCode` in DocumentScannerException.kt */
export const SCANNER_ERROR_CODES = [
  'SCAN_IN_PROGRESS',
  'SCANNER_UNAVAILABLE',
  'SCAN_INIT_ERROR',
  'SCAN_LAUNCH_ERROR',
  'SCAN_RESULT_ERROR',
  'FILE_COPY_ERROR',
  'FILE_NOT_FOUND',
  'STORAGE_FULL',
  'PDF_EXPORT_ERROR',
  'EXPORT_ERROR',
  'EXPORT_UNSUPPORTED',
  'EXPORT_IN_PROGRESS',
] as const;

/** Keep in sync with MAX_PAGE_LIMIT in ScanOptions.kt */
export const MAX_PAGE_LIMIT = 50;

export type ScannerErrorCode = (typeof SCANNER_ERROR_CODES)[number];

export type ScanDocumentOptions = {
  /** Append pages to an existing document. A new id is generated when omitted. */
  documentId?: string;
  /** 1–MAX_PAGE_LIMIT, defaults to MAX_PAGE_LIMIT */
  pageLimit?: number;
  /** Defaults to true */
  galleryImport?: boolean;
  /** Ask ML Kit for a PDF of this scan session. Defaults to true. */
  includePdf?: boolean;
};

export type ScannedPage = {
  /** 1-based position within this scan session */
  pageNumber: number;
  /** file:// URI in app-private persistent storage */
  uri: string;
};

export type ScanDocumentResult = {
  cancelled: boolean;
  documentId?: string;
  pages?: ScannedPage[];
  pdfUri?: string | null;
  pageCount?: number;
};

export type ExportMimeType = 'application/pdf' | 'image/jpeg';

/** Shared-storage destination; files land in `<collection>/ScannerApp/`. */
export type PublicCollection = 'documents' | 'pictures';

export type PublicFolderExport = {
  /** content:// URI of the exported copy */
  uri: string;
  /** Human-readable location, e.g. "Documents/ScannerApp/Report.pdf" */
  displayPath: string;
};

export type PickerExport = { cancelled: true } | { cancelled: false; uri: string };

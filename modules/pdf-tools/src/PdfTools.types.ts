/** Keep in sync with PdfToolsErrorCode in PdfToolsException.kt */
export const PDF_TOOLS_ERROR_CODES = [
  'PDF_INVALID',
  'PDF_PASSWORD_PROTECTED',
  'PDF_OPERATION_ERROR',
  'INVALID_PAGE_RANGE',
  'FILE_NOT_FOUND',
  'STORAGE_FULL',
  'IMPORT_ERROR',
  'PICKER_IN_PROGRESS',
] as const;

export type PdfToolsErrorCode = (typeof PDF_TOOLS_ERROR_CODES)[number];

/** Longest image edge / JPEG quality: light 2000px·85, balanced 1600px·70, strong 1100px·50. */
export type CompressionPreset = 'light' | 'balanced' | 'strong';

export type WatermarkPosition = 'diagonal' | 'tiled' | 'bottom';

export type WatermarkOptions = {
  text: string;
  /** PDF points */
  fontSize: number;
  /** 0.05–1 */
  opacity: number;
  /** #RRGGBB */
  color: string;
  position: WatermarkPosition;
};

/** A PDF written by the native side (file:// URI inside app storage). */
export type PdfFileOutput = { uri: string; pageCount: number; sizeBytes: number };

export type ImportedPdf = PdfFileOutput & { name: string };

export type PickPdfsResult = { cancelled: true } | { cancelled: false; files: ImportedPdf[] };

export type CompressResult = {
  uri: string;
  inputBytes: number;
  outputBytes: number;
  imagesRecompressed: number;
};

/** 1-based, inclusive. */
export type PageRange = { from: number; to: number };

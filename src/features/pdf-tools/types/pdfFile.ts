/** How a PDF entered PDF Tools. */
export type PdfFileSource = 'import' | 'document' | 'compress' | 'merge' | 'split' | 'watermark';

export type PdfFile = {
  id: string;
  name: string;
  /** Relative to the app document dir, e.g. `pdf-files/abc.pdf` */
  path: string;
  sizeBytes: number;
  pageCount: number;
  source: PdfFileSource;
  /** First-page JPEG; null if the PDF could not be rendered */
  thumbnailPath: string | null;
  createdAt: number;
};

export type NewPdfFile = Omit<PdfFile, 'createdAt'>;

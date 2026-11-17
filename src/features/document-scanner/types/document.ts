/**
 * Paths are stored relative to the app's document directory (e.g.
 * `documents/{id}/processed/page_x_001.jpg`) so they survive a change of the
 * absolute files-dir location (backup/restore, device transfer).
 */
export type ScannedDocument = {
  id: string;
  name: string;
  /** Relative path; null when there is no up-to-date PDF (see Phase 4 regeneration) */
  pdfPath: string | null;
  pageCount: number;
  createdAt: number;
  updatedAt: number;
};

export type DocumentPage = {
  id: string;
  documentId: string;
  /** 1-based, contiguous within a document */
  pageNumber: number;
  /** Untouched source image; null because ML Kit does not expose it */
  originalPath: string | null;
  processedPath: string;
  /** null = not analysed (image-quality analysis is not implemented yet) */
  isBlank: boolean | null;
  /** null = not analysed */
  sharpnessScore: number | null;
  createdAt: number;
};

export type NewDocumentPage = Pick<DocumentPage, 'id' | 'processedPath' | 'originalPath'>;

/** List item: a document plus its first page for the cover thumbnail. */
export type DocumentSummary = ScannedDocument & { coverPath: string | null };

/** A page ready for display (resolved file URI). */
export type PageView = {
  id: string;
  pageNumber: number;
  uri: string;
  /** The image file no longer exists on disk (e.g. removed outside the app) */
  missing: boolean;
};

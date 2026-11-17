import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  canSaveToPublicFolder,
  type ExportMimeType,
  generatePdf,
  type PickerExport,
  type PublicFolderExport,
  saveToPublicFolder,
  saveWithPicker,
} from '@modules/document-scanner';

import * as repo from '../repositories/document.repository';
import type { PageView, ScannedDocument } from '../types/document';
import { DocumentError, toDocumentError } from '../types/errors';
import { fileExists, SHARE_CACHE_DIR, toFileUri, toRelativePath } from './documentFileStorage';

const PDF_MIME: ExportMimeType = 'application/pdf';
const JPEG_MIME: ExportMimeType = 'image/jpeg';
const MAX_FILE_BASE_LENGTH = 100;

export { canSaveToPublicFolder };

/** File-system safe base name derived from the document name. */
export function exportBaseName(documentName: string): string {
  const safe = documentName
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_FILE_BASE_LENGTH);
  return safe || 'document';
}

async function requireDocument(db: SQLiteDatabase, id: string): Promise<ScannedDocument> {
  const document = await repo.getDocument(db, id);
  if (!document) throw new DocumentError('DOCUMENT_NOT_FOUND', `Document ${id} does not exist`);
  return document;
}

const inFlight = new Map<string, Promise<string>>();

/**
 * Returns the relative path of an up-to-date PDF, regenerating it from the current page order
 * when the stored one was invalidated by a page change. Concurrent calls share one build.
 */
export function ensurePdf(db: SQLiteDatabase, documentId: string): Promise<string> {
  const running = inFlight.get(documentId);
  if (running) return running;

  const task = buildPdfIfNeeded(db, documentId).finally(() => inFlight.delete(documentId));
  inFlight.set(documentId, task);
  return task;
}

async function buildPdfIfNeeded(db: SQLiteDatabase, documentId: string): Promise<string> {
  try {
    const document = await requireDocument(db, documentId);
    if (document.pdfPath && fileExists(document.pdfPath)) return document.pdfPath;

    const pages = await repo.listPages(db, documentId);
    const missing = pages.filter((page) => !fileExists(page.processedPath));
    if (missing.length > 0) {
      throw new DocumentError(
        'FILE_NOT_FOUND',
        `Pages ${missing.map((p) => p.pageNumber).join(', ')} are missing; cannot build PDF`,
      );
    }

    const pdfUri = await generatePdf(
      documentId,
      pages.map((page) => toFileUri(page.processedPath)),
    );
    const pdfPath = toRelativePath(pdfUri);
    // If pages changed while building, the row stays NULL and the next export rebuilds.
    await repo.setPdfPath(db, documentId, pdfPath, document.updatedAt);
    return pdfPath;
  } catch (error) {
    throw toDocumentError(error, 'PDF_EXPORT_ERROR');
  }
}

export async function savePdfToDocuments(
  db: SQLiteDatabase,
  documentId: string,
): Promise<PublicFolderExport> {
  const document = await requireDocument(db, documentId);
  const pdfPath = await ensurePdf(db, documentId);
  return withExportErrors(() =>
    saveToPublicFolder(toFileUri(pdfPath), `${exportBaseName(document.name)}.pdf`, PDF_MIME, 'documents'),
  );
}

export async function savePdfWithPicker(
  db: SQLiteDatabase,
  documentId: string,
): Promise<PickerExport> {
  const document = await requireDocument(db, documentId);
  const pdfPath = await ensurePdf(db, documentId);
  return withExportErrors(() =>
    saveWithPicker(toFileUri(pdfPath), `${exportBaseName(document.name)}.pdf`, PDF_MIME),
  );
}

export async function sharePdf(db: SQLiteDatabase, documentId: string): Promise<void> {
  const document = await requireDocument(db, documentId);
  const pdfPath = await ensurePdf(db, documentId);
  await shareFile(pdfPath, `${exportBaseName(document.name)}.pdf`, PDF_MIME, document.name);
}

export function pageFileName(documentName: string, page: PageView): string {
  return `${exportBaseName(documentName)} - page ${page.pageNumber}.jpg`;
}

export async function sharePage(documentName: string, page: PageView): Promise<void> {
  await shareFile(
    toRelativePath(page.uri),
    pageFileName(documentName, page),
    JPEG_MIME,
    `${documentName} – page ${page.pageNumber}`,
  );
}

export async function savePageToPictures(
  documentName: string,
  page: PageView,
): Promise<PublicFolderExport> {
  return withExportErrors(() =>
    saveToPublicFolder(page.uri, pageFileName(documentName, page), JPEG_MIME, 'pictures'),
  );
}

/**
 * Shares a copy with a readable file name (the stored files use internal names). The copy
 * lives in the cache dir, which is fine for a transient share; the private original stays.
 */
async function shareFile(relativePath: string, fileName: string, mimeType: string, title: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new DocumentError('SHARE_UNAVAILABLE', 'Sharing is not available');
  }
  if (!fileExists(relativePath)) {
    throw new DocumentError('FILE_NOT_FOUND', `${fileName} is missing`);
  }

  const shareDir = new Directory(Paths.cache, SHARE_CACHE_DIR);
  try {
    if (shareDir.exists) shareDir.delete();
    shareDir.create({ intermediates: true });
    const copy = new File(shareDir, fileName);
    await new File(Paths.document, relativePath).copy(copy);
    await Sharing.shareAsync(copy.uri, { mimeType, dialogTitle: title });
  } catch (error) {
    throw toDocumentError(error, 'EXPORT_ERROR');
  }
}

async function withExportErrors<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    throw toDocumentError(error, 'EXPORT_ERROR');
  }
}

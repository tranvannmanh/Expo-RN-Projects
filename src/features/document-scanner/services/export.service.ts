import type { SQLiteDatabase } from 'expo-sqlite';

import {
  type ExportMimeType,
  generatePdf,
  type PickerExport,
  type PublicFolderExport,
} from '@modules/document-scanner';
import {
  canSaveToPublicFolder,
  exportBaseName,
  saveStoredFileToPublicFolder,
  saveStoredFileWithPicker,
  shareStoredFile,
} from '@/shared/services/fileExport';

import * as repo from '../repositories/document.repository';
import type { PageView, ScannedDocument } from '../types/document';
import { DocumentError, toDocumentError } from '../types/errors';
import { fileExists, toFileUri, toRelativePath } from './documentFileStorage';
import { getT } from '@/shared/i18n';

const PDF_MIME: ExportMimeType = 'application/pdf';
const JPEG_MIME: ExportMimeType = 'image/jpeg';

export { canSaveToPublicFolder, exportBaseName };

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
  return saveStoredFileToPublicFolder(pdfPath, `${exportBaseName(document.name)}.pdf`, PDF_MIME, 'documents');
}

export async function savePdfWithPicker(
  db: SQLiteDatabase,
  documentId: string,
): Promise<PickerExport> {
  const document = await requireDocument(db, documentId);
  const pdfPath = await ensurePdf(db, documentId);
  return saveStoredFileWithPicker(pdfPath, `${exportBaseName(document.name)}.pdf`, PDF_MIME);
}

export async function sharePdf(db: SQLiteDatabase, documentId: string): Promise<void> {
  const document = await requireDocument(db, documentId);
  const pdfPath = await ensurePdf(db, documentId);
  await shareStoredFile(pdfPath, `${exportBaseName(document.name)}.pdf`, PDF_MIME, document.name);
}

export function pageFileName(documentName: string, page: PageView): string {
  return `${exportBaseName(documentName)} - ${getT().documents.pageFileName(page.pageNumber)}.jpg`;
}

export async function sharePage(documentName: string, page: PageView): Promise<void> {
  await shareStoredFile(
    toRelativePath(page.uri),
    pageFileName(documentName, page),
    JPEG_MIME,
    `${documentName} – ${getT().documents.pageFileName(page.pageNumber)}`,
  );
}

export async function savePageToPictures(
  documentName: string,
  page: PageView,
): Promise<PublicFolderExport> {
  return saveStoredFileToPublicFolder(
    toRelativePath(page.uri),
    pageFileName(documentName, page),
    JPEG_MIME,
    'pictures',
  );
}

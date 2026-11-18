import type { SQLiteDatabase } from 'expo-sqlite';

import {
  compressPdf,
  type CompressionPreset,
  getPdfInfo,
  mergePdfs,
  type PageRange,
  pickPdfs,
  getPdfPageSizes,
  renderPdfPage,
  renderPdfThumbnail,
  splitPdf,
  watermarkPdf,
  type WatermarkOptions,
} from '@modules/pdf-tools';
import type { PickerExport, PublicFolderExport } from '@modules/document-scanner';
import { Directory, File, Paths } from 'expo-file-system';

import { AppError, toAppError } from '@/shared/errors/appError';
import {
  copyFile,
  deleteFile,
  fileExists,
  listFilesRecursive,
  toFileUri,
  toRelativePath,
} from '@/shared/services/appFiles';
import {
  exportBaseName,
  saveStoredFileToPublicFolder,
  saveStoredFileWithPicker,
  shareStoredFile,
} from '@/shared/services/fileExport';

import * as repo from '../repositories/pdfFile.repository';
import type { NewPdfFile, PdfFile, PdfFileSource } from '../types/pdfFile';
import { formatRange } from '../utils/pageRanges';
import { getT } from '@/shared/i18n';

export const PDF_FILES_ROOT = 'pdf-files';
const PDF_MIME = 'application/pdf';
export const MAX_PDF_NAME_LENGTH = 120;
/** First-page preview width (px): sharp at ~180 dp on xxhdpi screens. */
const THUMBNAIL_WIDTH_PX = 540;
/**
 * A compressed copy must save at least 5% to be worth keeping; smaller gains are within the
 * noise of re-saving the file and would only add a near-duplicate to the list.
 */
const MIN_COMPRESSION_SAVING = 0.05;

/*
 * Consistency rules (same as scanned documents): the native side writes files first, then rows
 * are inserted; if the insert fails the new files are deleted. Sources are never modified —
 * every operation produces a new PDF. Files with no row are removed by reconcilePdfStorage.
 */

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const pdfPath = (id: string) => `${PDF_FILES_ROOT}/${id}.pdf`;
const thumbnailPath = (id: string) => `${PDF_FILES_ROOT}/thumbs/${id}.jpg`;

/** Page preview images live in the cache: the OS may clear them; they are re-rendered on demand. */
const PREVIEW_CACHE_DIR = 'pdf-preview';
const previewDir = (id: string) => new Directory(Paths.cache, PREVIEW_CACHE_DIR, id);
const previewPageFile = (id: string, pageIndex: number, widthPx: number) =>
  new File(previewDir(id), `page-${String(pageIndex + 1).padStart(4, '0')}-w${widthPx}.jpg`);

export function normalizePdfName(name: string): string {
  const trimmed = name
    .trim()
    .replace(/\.pdf$/i, '')
    .replace(/\s+/g, ' ')
    .slice(0, MAX_PDF_NAME_LENGTH);
  if (!trimmed) throw new AppError('INVALID_INPUT', 'Name must not be empty');
  return trimmed;
}

let reconciliation: Promise<string[]> | null = null;

/** Deletes files under pdf-files/ that no row references (crash leftovers). Once per process. */
export function reconcilePdfStorage(db: SQLiteDatabase): Promise<string[]> {
  reconciliation ??= (async () => {
    const referenced = new Set(await repo.listReferencedPaths(db));
    const orphans = listFilesRecursive(PDF_FILES_ROOT).filter((path) => !referenced.has(path));
    orphans.forEach(deleteFile);
    return orphans;
  })().catch((error: unknown) => {
    reconciliation = null;
    throw toAppError(error);
  });
  return reconciliation;
}

export async function listPdfFiles(db: SQLiteDatabase): Promise<PdfFile[]> {
  await reconcilePdfStorage(db);
  return guard(() => repo.listPdfFiles(db));
}

export async function getPdfFile(db: SQLiteDatabase, id: string): Promise<PdfFile | null> {
  return guard(() => repo.getPdfFile(db, id));
}

async function requirePdfFile(db: SQLiteDatabase, id: string): Promise<PdfFile> {
  const file = await repo.getPdfFile(db, id);
  if (!file) throw new AppError('DOCUMENT_NOT_FOUND', `PDF ${id} does not exist`);
  if (!fileExists(file.path)) throw new AppError('FILE_NOT_FOUND', `${file.name}.pdf is missing`);
  return file;
}

/** Renders the first page; a PDF that cannot be previewed simply has no thumbnail. */
async function createThumbnail(id: string, path: string): Promise<string | null> {
  try {
    await renderPdfThumbnail(toFileUri(path), toFileUri(thumbnailPath(id)), THUMBNAIL_WIDTH_PX);
    return thumbnailPath(id);
  } catch {
    deleteFile(thumbnailPath(id));
    return null;
  }
}

/** Adds thumbnails and inserts rows; on failure removes every file of these entries. */
async function register(
  db: SQLiteDatabase,
  entries: Omit<NewPdfFile, 'thumbnailPath'>[],
): Promise<PdfFile[]> {
  const files: NewPdfFile[] = [];
  try {
    for (const entry of entries) {
      files.push({
        ...entry,
        thumbnailPath: await createThumbnail(entry.id, entry.path),
      });
    }
    return await repo.insertPdfFiles(db, files, Date.now());
  } catch (error) {
    for (const entry of entries) {
      deleteFile(entry.path);
      deleteFile(thumbnailPath(entry.id));
    }
    throw toAppError(error);
  }
}

/** Opens the system picker; resolves [] when cancelled. */
export async function importPdfs(db: SQLiteDatabase): Promise<PdfFile[]> {
  await reconcilePdfStorage(db);
  const result = await guard(() => pickPdfs(true), 'IMPORT_ERROR');
  if (result.cancelled) return [];
  return register(
    db,
    result.files.map((file) => ({
      id: newId(),
      name: normalizeImportedName(file.name),
      path: toRelativePath(file.uri),
      sizeBytes: file.sizeBytes,
      pageCount: file.pageCount,
      source: 'import' as const,
    })),
  );
}

/** Copies a PDF that already lives in app storage (e.g. a scanned document's PDF). */
export async function addStoredPdf(
  db: SQLiteDatabase,
  sourcePath: string,
  name: string,
  source: PdfFileSource,
): Promise<PdfFile> {
  await reconcilePdfStorage(db);
  const id = newId();
  const path = pdfPath(id);
  try {
    await copyFile(sourcePath, path);
    const info = await getPdfInfo(toFileUri(path));
    const [file] = await register(db, [
      {
        id,
        name: normalizePdfName(name),
        path,
        sizeBytes: info.sizeBytes,
        pageCount: info.pageCount,
        source,
      },
    ]);
    return file;
  } catch (error) {
    deleteFile(path);
    throw toAppError(error, 'PDF_OPERATION_ERROR');
  }
}

export type CompressOutcome = {
  file: PdfFile;
  inputBytes: number;
  outputBytes: number;
};

export async function compress(
  db: SQLiteDatabase,
  id: string,
  preset: CompressionPreset,
): Promise<CompressOutcome> {
  const input = await requirePdfFile(db, id);
  const outId = newId();
  const result = await guard(
    () => compressPdf(toFileUri(input.path), toFileUri(pdfPath(outId)), preset),
    'PDF_OPERATION_ERROR',
  );

  if (result.outputBytes > result.inputBytes * (1 - MIN_COMPRESSION_SAVING)) {
    deleteFile(pdfPath(outId));
    throw new AppError(
      'NOT_REDUCED',
      `Only ${result.inputBytes - result.outputBytes} bytes would be saved`,
    );
  }
  const [file] = await register(db, [
    {
      id: outId,
      name: derivedName(input.name, getT().pdfTools.compress.suffix),
      path: pdfPath(outId),
      sizeBytes: result.outputBytes,
      pageCount: input.pageCount,
      source: 'compress',
    },
  ]);
  return {
    file,
    inputBytes: result.inputBytes,
    outputBytes: result.outputBytes,
  };
}

export async function merge(db: SQLiteDatabase, ids: string[], name: string): Promise<PdfFile> {
  if (ids.length < 2) throw new AppError('INVALID_INPUT', 'Select at least two PDFs to merge');
  const inputs = await Promise.all(ids.map((id) => requirePdfFile(db, id)));
  const outId = newId();
  const result = await guard(
    () =>
      mergePdfs(
        inputs.map((f) => toFileUri(f.path)),
        toFileUri(pdfPath(outId)),
      ),
    'PDF_OPERATION_ERROR',
  );
  const [file] = await register(db, [
    {
      id: outId,
      name: normalizePdfName(name),
      path: pdfPath(outId),
      sizeBytes: result.sizeBytes,
      pageCount: result.pageCount,
      source: 'merge',
    },
  ]);
  return file;
}

export async function split(
  db: SQLiteDatabase,
  id: string,
  ranges: PageRange[],
): Promise<PdfFile[]> {
  const input = await requirePdfFile(db, id);
  const outIds = ranges.map(() => newId());
  const outputs = await guard(
    () =>
      splitPdf(
        toFileUri(input.path),
        ranges,
        outIds.map((outId) => toFileUri(pdfPath(outId))),
      ),
    'PDF_OPERATION_ERROR',
  );
  return register(
    db,
    outputs.map((output, index) => ({
      id: outIds[index],
      name: derivedName(input.name, formatRange(ranges[index])),
      path: pdfPath(outIds[index]),
      sizeBytes: output.sizeBytes,
      pageCount: output.pageCount,
      source: 'split' as const,
    })),
  );
}

export async function watermark(
  db: SQLiteDatabase,
  id: string,
  options: WatermarkOptions,
): Promise<PdfFile> {
  if (!options.text.trim()) throw new AppError('INVALID_INPUT', 'Watermark text must not be empty');
  const input = await requirePdfFile(db, id);
  const outId = newId();
  const result = await guard(
    () => watermarkPdf(toFileUri(input.path), toFileUri(pdfPath(outId)), options),
    'PDF_OPERATION_ERROR',
  );
  const [file] = await register(db, [
    {
      id: outId,
      name: derivedName(input.name, getT().pdfTools.watermark.suffix),
      path: pdfPath(outId),
      sizeBytes: result.sizeBytes,
      pageCount: result.pageCount,
      source: 'watermark',
    },
  ]);
  return file;
}

export async function rename(db: SQLiteDatabase, id: string, name: string): Promise<void> {
  const updated = await guard(() => repo.renamePdfFile(db, id, normalizePdfName(name)));
  if (!updated) throw new AppError('DOCUMENT_NOT_FOUND', `PDF ${id} does not exist`);
}

/** Row first, then files: a failed file delete only leaves an orphan for reconcile. */
export async function remove(db: SQLiteDatabase, id: string): Promise<void> {
  const file = await guard(() => repo.deletePdfFile(db, id));
  if (!file) return;
  deleteFile(file.path);
  if (file.thumbnailPath) deleteFile(file.thumbnailPath);
  const preview = previewDir(id);
  if (preview.exists) preview.delete();
}

/** Page size in PDF points. */
export type PageSize = { width: number; height: number };

/** Sizes of every page, so the viewer can lay out the whole document before rendering. */
export async function getPreviewPageSizes(file: PdfFile): Promise<PageSize[]> {
  const sizes = await guard(() => getPdfPageSizes(toFileUri(file.path)), 'PDF_INVALID');
  return sizes.map(([width, height]) => ({ width, height }));
}

/**
 * Cached image of a page at a given pixel width, if it exists. Synchronous, so pages that were
 * rendered before show up immediately without going through the render queue.
 */
export function cachedPreviewPage(
  fileId: string,
  pageIndex: number,
  widthPx: number,
): string | null {
  const file = previewPageFile(fileId, pageIndex, widthPx);
  return file.exists ? file.uri : null;
}

/**
 * Renders a page (0-based) at `widthPx` if it is not cached yet; resolves to its file:// URI.
 * PDF Tools never modifies a stored PDF (each operation writes a new file), so images cached
 * per file id never go stale.
 */
export async function renderPreviewPage(
  file: PdfFile,
  pageIndex: number,
  widthPx: number,
): Promise<string> {
  const target = previewPageFile(file.id, pageIndex, widthPx);
  if (target.exists) return target.uri;
  return guard(
    () => renderPdfPage(toFileUri(file.path), pageIndex, target.uri, widthPx),
    'PDF_OPERATION_ERROR',
  );
}

export async function share(db: SQLiteDatabase, id: string): Promise<void> {
  const file = await requirePdfFile(db, id);
  await shareStoredFile(file.path, `${exportBaseName(file.name)}.pdf`, PDF_MIME, file.name);
}

export async function saveToDocuments(db: SQLiteDatabase, id: string): Promise<PublicFolderExport> {
  const file = await requirePdfFile(db, id);
  return saveStoredFileToPublicFolder(
    file.path,
    `${exportBaseName(file.name)}.pdf`,
    PDF_MIME,
    'documents',
  );
}

export async function saveWithPicker(db: SQLiteDatabase, id: string): Promise<PickerExport> {
  const file = await requirePdfFile(db, id);
  return saveStoredFileWithPicker(file.path, `${exportBaseName(file.name)}.pdf`, PDF_MIME);
}

function normalizeImportedName(fileName: string): string {
  try {
    return normalizePdfName(fileName);
  } catch {
    return getT().pdfTools.importedFallbackName;
  }
}

/** "Report" + "compressed" → "Report (compressed)", capped to the name limit. */
function derivedName(base: string, suffix: string): string {
  const tail = ` (${suffix})`;
  return `${base.slice(0, MAX_PDF_NAME_LENGTH - tail.length)}${tail}`;
}

async function guard<T>(
  task: () => Promise<T>,
  fallback: Parameters<typeof toAppError>[1] = 'DATABASE_ERROR',
): Promise<T> {
  try {
    return await task();
  } catch (error) {
    throw toAppError(error, fallback);
  }
}

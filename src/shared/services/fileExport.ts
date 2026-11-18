import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  canSaveToPublicFolder,
  type ExportMimeType,
  type PickerExport,
  type PublicCollection,
  type PublicFolderExport,
  saveToPublicFolder,
  saveWithPicker,
} from '@modules/document-scanner';

import { AppError, toAppError } from '../errors/appError';
import { fileExists, toFileUri } from './appFiles';

/** Temporary share copies (cache dir); cleared on app start and before each share. */
export const SHARE_CACHE_DIR = 'share';
const MAX_FILE_BASE_LENGTH = 100;

export { canSaveToPublicFolder };

/** File-system safe base name derived from a user-visible name. */
export function exportBaseName(name: string): string {
  const safe = name
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_FILE_BASE_LENGTH);
  return safe || 'document';
}

export function clearShareCache(): void {
  const dir = new Directory(Paths.cache, SHARE_CACHE_DIR);
  if (dir.exists) dir.delete();
}

/**
 * Shares a copy with a readable file name (stored files use internal names). The copy lives in
 * the cache dir, which is fine for a transient share; the private original stays untouched.
 */
export async function shareStoredFile(
  relativePath: string,
  fileName: string,
  mimeType: ExportMimeType,
  title: string,
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new AppError('SHARE_UNAVAILABLE', 'Sharing is not available');
  }
  if (!fileExists(relativePath)) {
    throw new AppError('FILE_NOT_FOUND', `${fileName} is missing`);
  }

  const shareDir = new Directory(Paths.cache, SHARE_CACHE_DIR);
  try {
    if (shareDir.exists) shareDir.delete();
    shareDir.create({ intermediates: true });
    const copy = new File(shareDir, fileName);
    await new File(Paths.document, relativePath).copy(copy);
    await Sharing.shareAsync(copy.uri, { mimeType, dialogTitle: title });
  } catch (error) {
    throw toAppError(error, 'EXPORT_ERROR');
  }
}

/** Documents/ScannerApp or Pictures/ScannerApp via MediaStore (Android 10+). */
export function saveStoredFileToPublicFolder(
  relativePath: string,
  fileName: string,
  mimeType: ExportMimeType,
  collection: PublicCollection,
): Promise<PublicFolderExport> {
  return withExportErrors(() => saveToPublicFolder(toFileUri(relativePath), fileName, mimeType, collection));
}

/** System "save as" picker (SAF). */
export function saveStoredFileWithPicker(
  relativePath: string,
  fileName: string,
  mimeType: ExportMimeType,
): Promise<PickerExport> {
  return withExportErrors(() => saveWithPicker(toFileUri(relativePath), fileName, mimeType));
}

async function withExportErrors<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    throw toAppError(error, 'EXPORT_ERROR');
  }
}

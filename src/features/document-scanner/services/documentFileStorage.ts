import { Directory, File, Paths } from 'expo-file-system';

/** Root folder (under the app document dir) shared with the native scanner module. */
export const DOCUMENTS_ROOT = 'documents';
const PDF_FILE_NAME = 'document.pdf';

const documentsRoot = () => new Directory(Paths.document, DOCUMENTS_ROOT);
const documentDir = (documentId: string) => new Directory(documentsRoot(), documentId);

/** Absolute file:// URI for a stored relative path. */
export function toFileUri(relativePath: string): string {
  return new File(Paths.document, relativePath).uri;
}

/**
 * Converts a native file:// URI under `.../files/documents/...` to the relative
 * `documents/...` path stored in SQLite. Throws for anything outside that root.
 */
export function toRelativePath(fileUri: string): string {
  const marker = `/${DOCUMENTS_ROOT}/`;
  const index = fileUri.indexOf(marker);
  if (!fileUri.startsWith('file://') || index < 0) {
    throw new Error(`Not an app document file: ${fileUri}`);
  }
  return fileUri.slice(index + 1);
}

export function fileExists(relativePath: string): boolean {
  return new File(Paths.document, relativePath).exists;
}

export function pdfRelativePath(documentId: string): string {
  return `${DOCUMENTS_ROOT}/${documentId}/${PDF_FILE_NAME}`;
}

/** Deletes a single stored file. Missing files are ignored (already gone). */
export function deleteFile(relativePath: string): void {
  const file = new File(Paths.document, relativePath);
  if (file.exists) file.delete();
}

/** Deletes a document folder and everything in it. Missing folders are ignored. */
export function deleteDocumentFiles(documentId: string): void {
  const dir = documentDir(documentId);
  if (dir.exists) dir.delete();
}

/** Temporary share copies (see export.service); safe to drop once no share is in progress. */
export const SHARE_CACHE_DIR = 'share';

export function clearShareCache(): void {
  const dir = new Directory(Paths.cache, SHARE_CACHE_DIR);
  if (dir.exists) dir.delete();
}

/** Names of all document folders currently on disk. */
export function listDocumentFolderIds(): string[] {
  const root = documentsRoot();
  if (!root.exists) return [];
  return root
    .list()
    .filter((entry): entry is Directory => entry instanceof Directory)
    .map((dir) => dir.name);
}

import { Directory, Paths } from 'expo-file-system';

/** Root folder (under the app document dir) shared with the native scanner module. */
export const DOCUMENTS_ROOT = 'documents';
const PDF_FILE_NAME = 'document.pdf';

const documentsRoot = () => new Directory(Paths.document, DOCUMENTS_ROOT);
const documentDir = (documentId: string) => new Directory(documentsRoot(), documentId);

export { deleteFile, fileExists, toFileUri, toRelativePath } from '@/shared/services/appFiles';

export function pdfRelativePath(documentId: string): string {
  return `${DOCUMENTS_ROOT}/${documentId}/${PDF_FILE_NAME}`;
}

/** Deletes a document folder and everything in it. Missing folders are ignored. */
export function deleteDocumentFiles(documentId: string): void {
  const dir = documentDir(documentId);
  if (dir.exists) dir.delete();
}

export { clearShareCache, SHARE_CACHE_DIR } from '@/shared/services/fileExport';

/** Names of all document folders currently on disk. */
export function listDocumentFolderIds(): string[] {
  const root = documentsRoot();
  if (!root.exists) return [];
  return root
    .list()
    .filter((entry): entry is Directory => entry instanceof Directory)
    .map((dir) => dir.name);
}

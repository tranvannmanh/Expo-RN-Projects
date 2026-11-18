import { Directory, File, Paths } from 'expo-file-system';

/**
 * App-private storage roots (under the document dir) that may hold user files. Paths stored in
 * SQLite are relative to the document dir, e.g. `documents/{id}/document.pdf`.
 */
export const APP_FILE_ROOTS = ['documents', 'pdf-files'] as const;

/** Absolute file:// URI for a stored relative path. */
export function toFileUri(relativePath: string): string {
  return new File(Paths.document, relativePath).uri;
}

/** Converts a native file:// URI inside one of APP_FILE_ROOTS to its relative path. */
export function toRelativePath(fileUri: string): string {
  if (fileUri.startsWith('file://')) {
    for (const root of APP_FILE_ROOTS) {
      const index = fileUri.indexOf(`/${root}/`);
      if (index >= 0) return fileUri.slice(index + 1);
    }
  }
  throw new Error(`Not an app document file: ${fileUri}`);
}

export function fileExists(relativePath: string): boolean {
  return new File(Paths.document, relativePath).exists;
}

/** Deletes a single stored file. Missing files are ignored (already gone). */
export function deleteFile(relativePath: string): void {
  const file = new File(Paths.document, relativePath);
  if (file.exists) file.delete();
}

/** Copies a stored file to another relative path (parent folders are created). */
export async function copyFile(fromRelative: string, toRelative: string): Promise<void> {
  const target = new File(Paths.document, toRelative);
  const parent = target.parentDirectory;
  if (!parent.exists) parent.create({ intermediates: true });
  await new File(Paths.document, fromRelative).copy(target);
}

/** Relative paths of every file below a root folder (recursive). */
export function listFilesRecursive(relativeDir: string): string[] {
  const walk = (dir: Directory, prefix: string): string[] =>
    dir.list().flatMap((entry) =>
      entry instanceof Directory
        ? walk(entry, `${prefix}${entry.name}/`)
        : [`${prefix}${entry.name}`],
    );
  const root = new Directory(Paths.document, relativeDir);
  return root.exists ? walk(root, `${relativeDir}/`) : [];
}

import { DocumentScannerError, toDocumentScannerError } from './src/DocumentScannerError';
import NativeModule from './src/DocumentScannerModule';
import type {
  ExportMimeType,
  PickerExport,
  PublicCollection,
  PublicFolderExport,
  ScanDocumentOptions,
  ScanDocumentResult,
} from './src/DocumentScanner.types';

export * from './src/DocumentScanner.types';
export { DocumentScannerError, toDocumentScannerError } from './src/DocumentScannerError';

function requireModule() {
  if (!NativeModule) {
    throw new DocumentScannerError(
      'SCANNER_UNAVAILABLE',
      'Document scanner native module is not available on this platform/build',
    );
  }
  return NativeModule;
}

/** Runs a native call and converts rejections into DocumentScannerError. */
async function call<T>(task: (module: NonNullable<typeof NativeModule>) => Promise<T>): Promise<T> {
  const module = requireModule();
  try {
    return await task(module);
  } catch (error) {
    throw toDocumentScannerError(error);
  }
}

/** True when the native module is linked and Google Play services is usable. */
export async function isScannerAvailable(): Promise<boolean> {
  if (!NativeModule) return false;
  try {
    return await NativeModule.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Opens the ML Kit document scanner. Resolves `{ cancelled: true }` when the user backs out;
 * rejects with a DocumentScannerError otherwise.
 */
export function scanDocument(options: ScanDocumentOptions = {}): Promise<ScanDocumentResult> {
  return call((module) => module.scanDocumentAsync(options));
}

/** MediaStore export (Documents/Pictures) needs Android 10+. */
export function canSaveToPublicFolder(): boolean {
  return NativeModule?.canSaveToPublicFolder() ?? false;
}

/**
 * Builds `documents/{documentId}/document.pdf` from page images (file:// URIs inside that
 * document folder), in the given order. Returns the PDF file:// URI.
 */
export function generatePdf(documentId: string, pageUris: string[]): Promise<string> {
  return call((module) => module.generatePdfAsync(documentId, pageUris));
}

/** Copies an app file to `<collection>/ScannerApp/` in shared storage (Android 10+). */
export function saveToPublicFolder(
  sourceUri: string,
  fileName: string,
  mimeType: ExportMimeType,
  collection: PublicCollection,
): Promise<PublicFolderExport> {
  return call((module) => module.saveToPublicFolderAsync(sourceUri, fileName, mimeType, collection));
}

/** Lets the user choose folder + name via the system picker (SAF), then copies the file. */
export function saveWithPicker(
  sourceUri: string,
  fileName: string,
  mimeType: ExportMimeType,
): Promise<PickerExport> {
  return call((module) => module.saveWithPickerAsync(sourceUri, fileName, mimeType));
}

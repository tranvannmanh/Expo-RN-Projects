import { requireOptionalNativeModule } from 'expo';

import type {
  ExportMimeType,
  PickerExport,
  PublicCollection,
  PublicFolderExport,
  ScanDocumentOptions,
  ScanDocumentResult,
} from './DocumentScanner.types';

type DocumentScannerNativeModule = {
  isAvailableAsync(): Promise<boolean>;
  scanDocumentAsync(options: ScanDocumentOptions): Promise<ScanDocumentResult>;
  canSaveToPublicFolder(): boolean;
  generatePdfAsync(documentId: string, pageUris: string[]): Promise<string>;
  saveToPublicFolderAsync(
    sourceUri: string,
    fileName: string,
    mimeType: ExportMimeType,
    collection: PublicCollection,
  ): Promise<PublicFolderExport>;
  saveWithPickerAsync(
    sourceUri: string,
    fileName: string,
    mimeType: ExportMimeType,
  ): Promise<PickerExport>;
};

/** Null on platforms without the native module (iOS, web, Expo Go). */
export default requireOptionalNativeModule<DocumentScannerNativeModule>('DocumentScanner');

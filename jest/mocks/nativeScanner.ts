/** jest.fn() stand-in for the native DocumentScanner module (no ML Kit in Jest). */
export const nativeScanner = {
  isAvailableAsync: jest.fn(async () => true),
  scanDocumentAsync: jest.fn(),
  canSaveToPublicFolder: jest.fn(() => true),
  generatePdfAsync: jest.fn(),
  saveToPublicFolderAsync: jest.fn(),
  saveWithPickerAsync: jest.fn(),
};

/** Native modules reject with objects carrying `code` + `message`. */
export function nativeError(code: string, message = code) {
  return Object.assign(new Error(message), { code });
}

import { canSaveToPublicFolder, isScannerAvailable, scanDocument } from '@modules/document-scanner';

// Overrides the setup mock: simulates iOS, web or Expo Go, where the module is not linked.
jest.mock('@modules/document-scanner/src/DocumentScannerModule', () => ({ __esModule: true, default: null }));

describe('document scanner without the native module', () => {
  it('rejects scans with SCANNER_UNAVAILABLE instead of crashing', async () => {
    await expect(scanDocument()).rejects.toMatchObject({
      name: 'DocumentScannerError',
      code: 'SCANNER_UNAVAILABLE',
    });
  });

  it('reports the scanner and public-folder export as unavailable', async () => {
    await expect(isScannerAvailable()).resolves.toBe(false);
    expect(canSaveToPublicFolder()).toBe(false);
  });
});

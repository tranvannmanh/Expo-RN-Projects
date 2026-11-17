import { memoryFs } from './mocks/expoFileSystem';
import { nativeScanner } from './mocks/nativeScanner';

jest.mock('expo-file-system', () => jest.requireActual('./mocks/expoFileSystem'));

jest.mock('@modules/document-scanner/src/DocumentScannerModule', () => ({
  __esModule: true,
  default: jest.requireActual('./mocks/nativeScanner').nativeScanner,
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

beforeEach(() => {
  memoryFs.reset();
  jest.clearAllMocks();
  // mockReset also drops per-test implementations (mockResolvedValue etc.) from earlier tests.
  Object.values(nativeScanner).forEach((fn) => fn.mockReset());
  nativeScanner.isAvailableAsync.mockResolvedValue(true);
  nativeScanner.canSaveToPublicFolder.mockReturnValue(true);
});

// Expected failures are logged by the app on purpose; keep test output readable.
jest.spyOn(console, 'error').mockImplementation(() => undefined);
jest.spyOn(console, 'warn').mockImplementation(() => undefined);

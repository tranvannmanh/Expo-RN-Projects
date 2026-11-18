import { memoryFs } from './mocks/expoFileSystem';
import { nativeScanner } from './mocks/nativeScanner';

jest.mock('expo-file-system', () => jest.requireActual('./mocks/expoFileSystem'));

jest.mock('@modules/document-scanner/src/DocumentScannerModule', () => ({
  __esModule: true,
  default: jest.requireActual('./mocks/nativeScanner').nativeScanner,
}));

// MMKV needs NitroModules (native); an in-memory store is enough for tests.
jest.mock('@/shared/services/storage.service', () => {
  const values = new Map<string, string>();
  return {
    StorageService: {
      set: (key: string, value: string) => void values.set(key, value),
      get: (key: string) => values.get(key),
      remove: (key: string) => values.delete(key),
    },
  };
});

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

beforeEach(() => {
  // Deterministic messages regardless of the machine's locale.
  jest.requireActual<typeof import('@/shared/i18n')>('@/shared/i18n').useLocaleStore.getState().setPreference('en');
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

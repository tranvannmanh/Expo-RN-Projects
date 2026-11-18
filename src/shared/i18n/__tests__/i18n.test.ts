import { defaultDocumentName } from '@/features/document-scanner/utils/documentName';
import { parsePageRanges } from '@/features/pdf-tools/utils/pageRanges';
import { errorMessage } from '@/shared/errors/errorMessage';
import { StorageService } from '@/shared/services/storage.service';

import { getT, useLocaleStore } from '..';
import { en } from '../messages/en';
import { vi } from '../messages/vi';

const setLanguage = (preference: 'system' | 'en' | 'vi') =>
  useLocaleStore.getState().setPreference(preference);

afterEach(() => setLanguage('en'));

describe('i18n', () => {
  it('switches the active dictionary and persists the choice', () => {
    setLanguage('vi');
    expect(getT()).toBe(vi);
    expect(useLocaleStore.getState().language).toBe('vi');
    expect(StorageService.get('settings.language')).toBe('vi');

    setLanguage('en');
    expect(getT()).toBe(en);
  });

  it('resolves "system" to a supported language', () => {
    setLanguage('system');
    expect(['en', 'vi']).toContain(useLocaleStore.getState().language);
  });

  it('localises generated names, errors and validation messages', () => {
    const date = new Date(2026, 10, 17, 14, 36);

    setLanguage('vi');
    expect(defaultDocumentName(date)).toMatch(/^Bản quét /);
    expect(errorMessage('STORAGE_FULL')).toBe(vi.errors.STORAGE_FULL);
    expect(() => parsePageRanges('9', 3)).toThrow('“9” nằm ngoài 1-3');

    setLanguage('en');
    expect(defaultDocumentName(date)).toMatch(/^Scan /);
    expect(() => parsePageRanges('9', 3)).toThrow('“9” is outside 1-3');
  });

  it('handles plurals per language', () => {
    expect(en.common.pages(1)).toBe('1 page');
    expect(en.common.pages(3)).toBe('3 pages');
    expect(vi.common.pages(1)).toBe('1 trang');
    expect(en.pdfTools.split.run(1)).toBe('Create 1 PDF');
    expect(vi.pdfTools.split.run(4)).toBe('Tạo 4 PDF');
  });

  it('has a non-empty message for every error code in every language', () => {
    for (const dictionary of [en, vi]) {
      for (const message of Object.values(dictionary.errors)) {
        expect(message.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

import { requireOptionalNativeModule } from 'expo';

import type {
  CompressionPreset,
  CompressResult,
  PdfFileOutput,
  PickPdfsResult,
  WatermarkOptions,
} from './PdfTools.types';

type PdfToolsNativeModule = {
  pickPdfsAsync(allowMultiple: boolean): Promise<PickPdfsResult>;
  getInfoAsync(uri: string): Promise<{ pageCount: number; sizeBytes: number }>;
  renderThumbnailAsync(input: string, output: string, widthPx: number): Promise<string>;
  getPageSizesAsync(input: string): Promise<[number, number][]>;
  renderPageAsync(input: string, pageIndex: number, output: string, widthPx: number): Promise<string>;
  compressAsync(input: string, output: string, preset: CompressionPreset): Promise<CompressResult>;
  mergeAsync(inputs: string[], output: string): Promise<PdfFileOutput>;
  splitAsync(input: string, ranges: [number, number][], outputs: string[]): Promise<PdfFileOutput[]>;
  watermarkAsync(input: string, output: string, options: WatermarkOptions): Promise<PdfFileOutput>;
};

/** Null on platforms without the native module (iOS, web, Expo Go). */
export default requireOptionalNativeModule<PdfToolsNativeModule>('PdfTools');

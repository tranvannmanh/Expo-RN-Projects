import NativeModule from './src/PdfToolsModule';
import { PdfToolsError, toPdfToolsError } from './src/PdfToolsError';
import type { CompressionPreset, PageRange, WatermarkOptions } from './src/PdfTools.types';

export * from './src/PdfTools.types';
export { PdfToolsError, toPdfToolsError } from './src/PdfToolsError';

type Native = NonNullable<typeof NativeModule>;

/** Runs a native call; rejections become PdfToolsError with a stable code. */
async function call<T>(task: (module: Native) => Promise<T>): Promise<T> {
  if (!NativeModule) {
    throw new PdfToolsError(
      'PDF_OPERATION_ERROR',
      'PDF tools are not available on this platform/build',
    );
  }
  try {
    return await task(NativeModule);
  } catch (error) {
    throw toPdfToolsError(error);
  }
}

export const isPdfToolsAvailable = () => NativeModule !== null;

/** System picker (no storage permission); copies and validates the picked PDFs. */
export const pickPdfs = (allowMultiple = true) => call((m) => m.pickPdfsAsync(allowMultiple));

export const getPdfInfo = (uri: string) => call((m) => m.getInfoAsync(uri));

export const renderPdfThumbnail = (input: string, output: string, widthPx: number) =>
  call((m) => m.renderThumbnailAsync(input, output, widthPx));

/** Size of every page in PDF points ([width, height]); fast, nothing is rendered. */
export const getPdfPageSizes = (input: string) => call((m) => m.getPageSizesAsync(input));

/**
 * Renders one page (0-based) to a JPEG at `output` (must be under cache/pdf-preview).
 * An existing output is reused. Returns its file:// URI.
 */
export const renderPdfPage = (input: string, pageIndex: number, output: string, widthPx: number) =>
  call((m) => m.renderPageAsync(input, pageIndex, output, widthPx));

export const compressPdf = (input: string, output: string, preset: CompressionPreset) =>
  call((m) => m.compressAsync(input, output, preset));

export const mergePdfs = (inputs: string[], output: string) =>
  call((m) => m.mergeAsync(inputs, output));

export const splitPdf = (input: string, ranges: PageRange[], outputs: string[]) =>
  call((m) =>
    m.splitAsync(
      input,
      ranges.map((r): [number, number] => [r.from, r.to]),
      outputs,
    ),
  );

export const watermarkPdf = (input: string, output: string, options: WatermarkOptions) =>
  call((m) => m.watermarkAsync(input, output, options));

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import type { CompressionPreset, PageRange, WatermarkOptions } from '@modules/pdf-tools';
import { type AppError, type AppErrorCode, toAppError } from '@/shared/errors/appError';

import * as service from '../services/pdfTools.service';
import { pdfFileKeys } from './queryKeys';

/**
 * Normalises errors to AppError, logs technical details and refreshes PDF Tools queries.
 * NOT_REDUCED is an expected outcome, so it is not logged as an error.
 */
function usePdfMutation<TVariables, TResult>(
  label: string,
  mutationFn: (db: ReturnType<typeof useSQLiteContext>, variables: TVariables) => Promise<TResult>,
  fallback: AppErrorCode = 'PDF_OPERATION_ERROR',
) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation<TResult, AppError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      try {
        return await mutationFn(db, variables);
      } catch (error) {
        const appError = toAppError(error, fallback);
        if (appError.code !== 'NOT_REDUCED') {
          console.error(
            `[PdfTools] ${label} failed`,
            appError.code,
            appError.cause ?? appError.message,
          );
        }
        throw appError;
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: pdfFileKeys.all }),
  });
}

export const useImportPdfs = () =>
  usePdfMutation('import', (db, _: void) => service.importPdfs(db), 'IMPORT_ERROR');

export const useCompressPdf = (id: string) =>
  usePdfMutation('compress', (db, preset: CompressionPreset) => service.compress(db, id, preset));

export const useMergePdfs = () =>
  usePdfMutation('merge', (db, input: { ids: string[]; name: string }) =>
    service.merge(db, input.ids, input.name),
  );

export const useSplitPdf = (id: string) =>
  usePdfMutation('split', (db, ranges: PageRange[]) => service.split(db, id, ranges));

export const useWatermarkPdf = (id: string) =>
  usePdfMutation('watermark', (db, options: WatermarkOptions) =>
    service.watermark(db, id, options),
  );

export const useRenamePdf = (id: string) =>
  usePdfMutation('rename', (db, name: string) => service.rename(db, id, name), 'DATABASE_ERROR');

export const useDeletePdf = () =>
  usePdfMutation('delete', (db, id: string) => service.remove(db, id), 'DATABASE_ERROR');

export const useSharePdf = () =>
  usePdfMutation('share', (db, id: string) => service.share(db, id), 'EXPORT_ERROR');

export const useSavePdfToDocuments = () =>
  usePdfMutation('save', (db, id: string) => service.saveToDocuments(db, id), 'EXPORT_ERROR');

export const useSavePdfWithPicker = () =>
  usePdfMutation('save as', (db, id: string) => service.saveWithPicker(db, id), 'EXPORT_ERROR');

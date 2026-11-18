/** The scanner feature uses the app-wide error type; these aliases keep its API stable. */
export {
  AppError as DocumentError,
  type AppErrorCode as DocumentErrorCode,
  toAppError as toDocumentError,
} from '@/shared/errors/appError';

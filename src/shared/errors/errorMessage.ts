import { getT } from '@/shared/i18n';

import type { AppErrorCode } from './appError';

/** User-facing message in the current language (technical details stay in AppError.message). */
export function errorMessage(code: AppErrorCode): string {
  return getT().errors[code];
}

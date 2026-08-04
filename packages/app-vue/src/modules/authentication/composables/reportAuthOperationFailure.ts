/**
 * Shared failure reporting for the active Better Auth login/register operations.
 */
import { toast } from 'vue-sonner';
import type { ResultError } from '@memoflow/contracts/result';
import type { AuthContext } from './useAuthContext';

type AuthFailureDeps = Pick<
  AuthContext,
  'store' | 't' | 'lastResultError' | 'getLocalizedAuthError'
>;

/** Report a failed Result (result.ok === false) and return false. */
export function reportAuthResultFailure(
  deps: AuthFailureDeps,
  error: ResultError,
  toastKey: string,
): false {
  deps.lastResultError.value = error;
  const message = deps.getLocalizedAuthError(error, 'auth.errors.UNKNOWN');
  deps.store.setError(message);
  toast.error(deps.t(toastKey), { description: message });
  return false;
}

/** Report a thrown error in an auth operation catch block and return false. */
export function reportAuthCatchFailure(
  deps: AuthFailureDeps,
  error: unknown,
  logLabel: string,
  toastKey: string,
): false {
  deps.store.setLoading(false);
  console.error(`[auth] ${logLabel} failed`, error);
  deps.lastResultError.value = {
    code: 'UNKNOWN',
    message: error instanceof Error ? error.message : 'Unknown error',
  };
  const description = deps.getLocalizedAuthError(error, 'auth.errors.UNKNOWN');
  deps.store.setError(description);
  toast.error(deps.t(toastKey), { description });
  return false;
}

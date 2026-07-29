/**
 * Residual 1045: sole post-auth success completion for login/register/remembered-desktop.
 * Desktop host owns session → reset store; Web applies handleAuthSuccess then redirect.
 * Exact dual retired from useLogin / useRegister / useRememberedAccounts.
 */
import { toast } from 'vue-sonner';
import type { AuthResponseDTO } from '@memoflow/contracts/authentication';
import { hasDesktopAuthApi } from '../../../shared/utils/desktop-auth-recovery';

export async function completeAuthSuccess(
  deps: {
    resetStore: () => void;
    handleAuthSuccess: (data: AuthResponseDTO) => void;
    redirectWithReload: (path: string) => void;
  },
  data: AuthResponseDTO,
  title: string,
  description: string,
): Promise<boolean> {
  if (typeof window !== 'undefined' && hasDesktopAuthApi(window)) {
    deps.resetStore();
  } else {
    deps.handleAuthSuccess(data);
  }
  toast.success(title, { description });
  if (typeof window !== 'undefined' && hasDesktopAuthApi(window)) return true;
  deps.redirectWithReload('/');
  return true;
}

import { AuthChannels } from '@memoflow/contracts/electron';
import type { AuthBootstrapSnapshot } from '@memoflow/contracts/authentication';
import { fromIpcResult, isOk, type IpcResult } from '@memoflow/contracts/result';
import { useAuthenticationStore } from '../../modules/authentication/stores/authentication-store';
import type { DesktopAuthApi } from './desktop-auth-recovery';

// Residual 903: DesktopBootstrapApi dual retired — exact shape of DesktopAuthApi.
// Residual 919: DesktopBootstrapApi name fully retired — hydrate accepts DesktopAuthApi sole body.
export async function hydrateDesktopBootstrapAuthState(
  api?: DesktopAuthApi,
): Promise<boolean> {
  if (!api?.invoke) {
    useAuthenticationStore().reset();
    return false;
  }

  const store = useAuthenticationStore();
  const response = (await api.invoke(
    AuthChannels.GET_BOOTSTRAP_SNAPSHOT,
  )) as IpcResult<AuthBootstrapSnapshot>;
  const result = fromIpcResult(response);

  if (!isOk(result) || !result.data?.status) {
    store.reset();
    return false;
  }

  store.hydrateDesktopBootstrapSnapshot(result.data);
  return true;
}

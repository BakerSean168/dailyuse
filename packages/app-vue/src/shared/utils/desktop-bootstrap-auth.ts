import { AuthChannels } from '@dailyuse/contracts/electron';
import type { AuthBootstrapSnapshot } from '@dailyuse/contracts/authentication';
import { fromIpcResult, isOk, type IpcResult } from '@dailyuse/contracts/result';
import { useAuthenticationStore } from '../../modules/authentication/stores/authentication-store';
import type { DesktopAuthApi } from './desktop-auth-recovery';

// Residual 903: DesktopBootstrapApi dual retired — exact shape of DesktopAuthApi (type alias only).
export type DesktopBootstrapApi = DesktopAuthApi;

export async function hydrateDesktopBootstrapAuthState(
  api?: DesktopBootstrapApi,
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

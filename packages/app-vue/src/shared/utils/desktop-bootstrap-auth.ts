import { AuthChannels } from '@dailyuse/contracts/electron';
import type { AuthBootstrapSnapshot } from '@dailyuse/contracts/authentication';
import { useAuthenticationStore } from '../../modules/authentication/stores/authentication-store';

export type DesktopBootstrapApi = {
  invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>;
};

export async function hydrateDesktopBootstrapAuthState(
  api?: DesktopBootstrapApi,
): Promise<boolean> {
  if (!api?.invoke) {
    useAuthenticationStore().reset();
    return false;
  }

  const store = useAuthenticationStore();
  const snapshot = (await api.invoke(AuthChannels.GET_BOOTSTRAP_SNAPSHOT)) as AuthBootstrapSnapshot;

  if (!snapshot?.status) {
    store.reset();
    return false;
  }

  store.hydrateDesktopBootstrapSnapshot(snapshot);
  return true;
}

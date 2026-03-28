import { AuthChannels } from '@dailyuse/contracts/electron';

export type DesktopAuthApi = {
  invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>;
};

type DesktopAuthStatus = {
  authenticated?: boolean;
  runtimeState?: string;
};

type DesktopAuthErrorLike = {
  code?: string | null;
} | null | undefined;

export function isDesktopAuthRecoverable(error: DesktopAuthErrorLike): boolean {
  return error?.code === 'AUTH_REQUIRED' || error?.code === 'AUTH_RESTORING';
}

export function getDesktopAuthApi(
  host?: { electronAPI?: DesktopAuthApi },
): DesktopAuthApi | undefined {
  if (host) {
    return host.electronAPI;
  }

  if (typeof window === 'undefined') {
    return undefined;
  }

  return (window as { electronAPI?: DesktopAuthApi }).electronAPI;
}

export async function ensureDesktopAuthReadyWithApi(
  api?: DesktopAuthApi,
  logScope = 'DesktopAuthRecovery',
): Promise<boolean> {
  if (!api?.invoke) {
    return false;
  }

  try {
    const status = (await api.invoke(AuthChannels.GET_STATUS)) as DesktopAuthStatus;

    if (status?.authenticated) {
      return true;
    }

    if (status?.runtimeState === 'RESTORING' || status?.runtimeState === 'UNINITIALIZED') {
      await api.invoke(AuthChannels.INITIALIZE);
      const refreshed = (await api.invoke(AuthChannels.GET_STATUS)) as DesktopAuthStatus;
      return Boolean(refreshed?.authenticated);
    }
  } catch (error) {
    console.warn(`[${logScope}] Failed to ensure desktop auth readiness`, error);
  }

  return false;
}

export async function recoverDesktopAuthIfNeeded(
  error: DesktopAuthErrorLike,
  api?: DesktopAuthApi,
  logScope = 'DesktopAuthRecovery',
): Promise<boolean> {
  if (!isDesktopAuthRecoverable(error)) {
    return false;
  }

  return ensureDesktopAuthReadyWithApi(api, logScope);
}

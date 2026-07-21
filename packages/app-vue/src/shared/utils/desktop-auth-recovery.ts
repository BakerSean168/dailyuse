import { AuthChannels } from '@dailyuse/contracts/electron';
import { fromIpcResult, isOk, type IpcResult } from '@dailyuse/contracts/result';

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
  return host?.electronAPI;
}

async function readAuthStatus(
  api: DesktopAuthApi,
): Promise<DesktopAuthStatus | null> {
  const response = (await api.invoke!(AuthChannels.GET_STATUS)) as IpcResult<DesktopAuthStatus>;
  const result = fromIpcResult(response);
  return isOk(result) ? result.data : null;
}

export async function ensureDesktopAuthReadyWithApi(
  api?: DesktopAuthApi,
  logScope = 'DesktopAuthRecovery',
): Promise<boolean> {
  if (!api?.invoke) {
    return false;
  }

  try {
    const status = await readAuthStatus(api);

    if (status?.authenticated) {
      return true;
    }

    if (status?.runtimeState === 'RESTORING' || status?.runtimeState === 'UNINITIALIZED') {
      await api.invoke(AuthChannels.INITIALIZE);
      const refreshed = await readAuthStatus(api);
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

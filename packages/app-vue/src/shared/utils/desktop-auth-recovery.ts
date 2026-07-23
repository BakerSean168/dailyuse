import { AuthChannels } from '@dailyuse/contracts/electron';
import type { AuthStatus } from '@dailyuse/contracts/authentication';
import { fromIpcResult, isOk, type IpcResult } from '@dailyuse/contracts/result';

export type DesktopAuthApi = {
  invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>;
};

// Residual 901: local DesktopAuthStatus dual retired — sole status shape is contracts AuthStatus
// (residual 865 already deleted AuthStatusDTO; recovery must not reintroduce a slim dual body).

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
): Promise<AuthStatus | null> {
  const response = (await api.invoke!(AuthChannels.GET_STATUS)) as IpcResult<AuthStatus>;
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

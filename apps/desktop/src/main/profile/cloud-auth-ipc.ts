import { ipcMain } from 'electron';
import type { CloudSessionState } from '@memoflow/contracts';
import { CloudAuthChannels } from '@memoflow/contracts/electron';
import { fail, ok } from '@memoflow/contracts/result';
import { getApiBaseUrl } from '../utils/api-config';
import type { DesktopProfileRuntimeManager } from './desktop-profile-runtime-manager';
import type { DeviceAuthCoordinator } from './device-auth-coordinator';
import type { ProfileRegistry } from './profile-registry';
import type { CloudSessionStore } from './cloud-session-store';

function authOrigin(): string {
  return new URL(getApiBaseUrl()).origin;
}

export function registerCloudAuthIpc(
  registry: ProfileRegistry,
  runtime: DesktopProfileRuntimeManager,
  sessions: CloudSessionStore,
  cloudConnection?: DeviceAuthCoordinator,
): void {
  ipcMain.handle(CloudAuthChannels.SESSION, async () => {
    const profile = await registry.getActiveProfile();
    if (!profile) return ok<CloudSessionState>({ account: null, session: null });
    const stored = await sessions.load(profile.profileId);
    if (!stored) return ok<CloudSessionState>({ account: null, session: null });
    const session = Date.parse(stored.expiresAt) > Date.now()
      ? { id: stored.sessionId, expiresAt: stored.expiresAt }
      : null;
    return ok<CloudSessionState>({ account: stored.account, session });
  });

  ipcMain.handle(CloudAuthChannels.SIGN_OUT, async () => {
    const profile = await registry.getActiveProfile();
    if (profile) {
      const stored = await sessions.load(profile.profileId);
      if (stored) {
        await fetch(`${authOrigin()}/api/auth/sign-out`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${stored.token}`,
          },
          body: '{}',
        }).catch(() => undefined);
      }
      await sessions.remove(profile.profileId);
      await runtime.disableCloudSync();
      cloudConnection?.clearForProfile(profile.profileId);
    }
    return ok(undefined);
  });

  ipcMain.handle(CloudAuthChannels.CLOUD_CONNECTION_BEGIN, async () =>
    cloudConnection
      ? cloudConnection.begin()
      : fail({ code: 'CLOUD_CONNECTION_UNAVAILABLE', message: '云端连接尚未初始化' }));
  ipcMain.handle(CloudAuthChannels.CLOUD_CONNECTION_CURRENT, async () =>
    cloudConnection
      ? cloudConnection.getCurrent()
      : fail({ code: 'CLOUD_CONNECTION_UNAVAILABLE', message: '云端连接尚未初始化' }));
  ipcMain.handle(
    CloudAuthChannels.CLOUD_CONNECTION_STATUS,
    async (_event, input: { attemptId: string }) =>
      cloudConnection
        ? cloudConnection.getStatus(input.attemptId)
        : fail({ code: 'CLOUD_CONNECTION_UNAVAILABLE', message: '云端连接尚未初始化' }),
  );
  ipcMain.handle(
    CloudAuthChannels.CLOUD_CONNECTION_CANCEL,
    async (_event, input: { attemptId: string }) =>
      cloudConnection
        ? cloudConnection.cancel(input.attemptId)
        : fail({ code: 'CLOUD_CONNECTION_UNAVAILABLE', message: '云端连接尚未初始化' }),
  );
}

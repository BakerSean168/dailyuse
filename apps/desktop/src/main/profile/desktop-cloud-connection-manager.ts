import type { ProfileCloudState } from '@memoflow/contracts/electron';
import { getApiBaseUrl } from '../utils/api-config';
import type { DesktopProfileRuntimeManager } from './desktop-profile-runtime-manager';
import type { ProfileDescriptor } from './profile-registry';
import { CloudSessionStore } from './cloud-session-store';

interface BetterAuthSessionResponse {
  session?: { id: string; expiresAt: string | Date };
  user?: { id: string; email: string; name: string; emailVerified?: boolean };
}

export class DesktopCloudConnectionManager {
  constructor(
    private readonly sessions: CloudSessionStore,
    private readonly runtime: DesktopProfileRuntimeManager,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async getState(profile: ProfileDescriptor | null): Promise<ProfileCloudState> {
    if (!profile?.cloudBinding) return 'UNBOUND';
    const stored = await this.sessions.load(profile.profileId);
    if (!stored || Date.parse(stored.expiresAt) <= Date.now()) return 'REAUTH_REQUIRED';

    try {
      const response = await this.fetchImpl(`${new URL(getApiBaseUrl()).origin}/api/auth/get-session`, {
        headers: { authorization: `Bearer ${stored.token}` },
      });
      if (response.status === 401) return 'REAUTH_REQUIRED';
      if (!response.ok) return 'OFFLINE';
      const payload = (await response.json().catch(() => null)) as BetterAuthSessionResponse | null;
      if (!payload?.session || !payload.user) return 'REAUTH_REQUIRED';
      if (payload.user.id !== profile.cloudBinding.cloudAccountId) return 'REAUTH_REQUIRED';

      await this.sessions.save(profile.profileId, {
        token: stored.token,
        sessionId: payload.session.id,
        account: {
          id: payload.user.id,
          email: payload.user.email,
          name: payload.user.name,
          emailVerified: payload.user.emailVerified === true,
        },
        expiresAt: new Date(payload.session.expiresAt).toISOString(),
      });
      return 'ONLINE';
    } catch {
      return 'OFFLINE';
    }
  }

  async restore(profile: ProfileDescriptor): Promise<ProfileCloudState> {
    const state = await this.getState(profile);
    if (state === 'ONLINE') {
      await this.runtime.enableCloudSync({
        getAccessToken: () => this.sessions.getValidToken(profile.profileId),
      });
    }
    return state;
  }
}

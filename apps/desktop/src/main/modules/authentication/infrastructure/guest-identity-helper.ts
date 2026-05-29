/**
 * Guest Identity Helper
 *
 * Manages guest identity creation, restoration, and cleanup.
 * Extracted from SessionManager to isolate guest-identity concern.
 *
 * @module authentication/infrastructure/guest-identity-helper
 */

import { AuthSession } from '@dailyuse/authentication/domain-server';
import { DeviceInfo } from '@dailyuse/authentication/domain-shared';
import type { IdentityId, AuthSessionId, DeviceInfoClientDTO, DeviceInfoDTO } from '@dailyuse/contracts/authentication';
import { DeviceType } from '@dailyuse/contracts/authentication';
import type { IAuthSessionRepository } from '@dailyuse/authentication/domain-server';
import type { ILogger } from '@dailyuse/utils/logger';
import { IdentityId as IdentityIdValue } from '@dailyuse/domain-shared';
import { generateUUID } from '@dailyuse/utils/shared';
import type { TokenManager, TokenData } from './token-manager';

function toIdentityId(value: string | IdentityId): IdentityId {
  return IdentityIdValue.of(String(value));
}

function toDeviceInfoDTO(client: DeviceInfoClientDTO): DeviceInfoDTO {
  const now = Date.now();
  return {
    deviceId: client.deviceId,
    deviceFingerprint: client.deviceFingerprint ?? '',
    deviceType: (client.deviceType as DeviceType) || 'Browser',
    deviceName: client.deviceName ?? null,
    os: client.os ?? null,
    osVersion: client.osVersion ?? null,
    browser: null,
    appVersion: client.appVersion ?? null,
    ipAddress: null,
    userAgent: null,
    location: null,
    firstSeenAt: client.firstSeenAt ?? now,
    lastSeenAt: client.lastSeenAt ?? now,
  };
}

const GUEST_ID_PREFIX = 'IdentityId';
const GUEST_ACCESS_TOKEN = 'guest-local-token';

export interface GuestIdentityResult {
  guestId: string;
  session: AuthSession;
}

export class GuestIdentityHelper {
  constructor(
    private readonly getTokenManager: () => TokenManager,
    private readonly sessionRepository: IAuthSessionRepository,
    private readonly logger: ILogger,
  ) {}

  private get tokenManager(): TokenManager {
    return this.getTokenManager();
  }

  isGuestToken(tokenData: { accessToken?: string; refreshToken?: string } | null): boolean {
    if (!tokenData) return false;
    return (
      tokenData.accessToken === GUEST_ACCESS_TOKEN && tokenData.refreshToken === GUEST_ACCESS_TOKEN
    );
  }

  async getOrCreateGuestIdentity(
    getDeviceInfo: () => DeviceInfoClientDTO,
  ): Promise<GuestIdentityResult> {
    const tokenData =
      this.tokenManager.getCachedTokenData() ?? (await this.tokenManager.loadTokens());
    const cachedGuestId = tokenData?.identityId;
    const expectedIdentityPrefix = `${GUEST_ID_PREFIX}_`;

    if (cachedGuestId && this.isGuestToken(tokenData)) {
      if (!cachedGuestId.startsWith(expectedIdentityPrefix)) {
        this.logger.warn('Discarding stale guest token with unsupported identity prefix', {
          identityId: cachedGuestId,
          expectedPrefix: expectedIdentityPrefix,
        });
        await this.tokenManager.clearTokens();
      } else {
        const existingGuestSessions = await this.sessionRepository.findByIdentityId(
          toIdentityId(cachedGuestId),
        );
        if (existingGuestSessions.length > 0) {
          const guestSession = existingGuestSessions[0];
          this.logger.info('Restored existing guest identity', {
            guestId: cachedGuestId,
            sessionId: guestSession.id,
          });
          return { guestId: guestSession.identityId, session: guestSession };
        }

        const session = await this.restoreRuntimeSessionFromToken(
          { ...tokenData, identityId: toIdentityId(cachedGuestId) },
          getDeviceInfo,
        );
        this.logger.info('Reused cached guest identity with reconstructed session', {
          guestId: cachedGuestId,
          sessionId: session.id,
        });
        return { guestId: cachedGuestId, session };
      }
    }

    // Create new persistent guest identity
    const guestId = `${GUEST_ID_PREFIX}_${generateUUID()}`;
    const deviceInfo = getDeviceInfo();
    const device = DeviceInfo.create(toDeviceInfoDTO(deviceInfo));

    const session = AuthSession.create({
      id: generateUUID() as unknown as AuthSessionId,
      identityId: toIdentityId(guestId),
      refreshTokenHash: generateUUID(),
      expiresAt: Date.now() + 3600 * 1000,
      deviceInfo: device.toDTO(),
    });

    this.logger.info('Persisting new guest session locally', {
      guestId,
      sessionId: session.id,
    });
    await this.sessionRepository.save(session);

    try {
      this.logger.info('Persisting guest tokens locally', {
        guestId,
        sessionId: session.id,
      });
      await this.tokenManager.saveTokens({
        accessToken: GUEST_ACCESS_TOKEN,
        refreshToken: GUEST_ACCESS_TOKEN,
        accessTokenExpiresIn: 365 * 24 * 3600,
        refreshTokenExpiresIn: 365 * 24 * 3600,
        identityId: toIdentityId(guestId),
        sessionId: session.id,
      });
    } catch (error) {
      session.revoke();
      await this.sessionRepository.save(session).catch((cleanupError) => {
        this.logger.warn('Failed to roll back guest session after token persistence failure', {
          cleanupError,
          guestId,
          sessionId: session.id,
        });
      });
      throw error;
    }

    this.logger.info('Created new guest identity', { guestId, sessionId: session.id });
    return { guestId, session };
  }

  async clearGuestIdentity(): Promise<void> {
    const tokenData =
      this.tokenManager.getCachedTokenData() ?? (await this.tokenManager.loadTokens());
    const cachedGuestId = tokenData?.identityId;

    if (cachedGuestId && this.isGuestToken(tokenData)) {
      const guestSessions = await this.sessionRepository.findByIdentityId(
        toIdentityId(cachedGuestId),
      );
      for (const session of guestSessions) {
        session.revoke();
        await this.sessionRepository.save(session);
      }
    }
    this.logger.info('Guest identity cleared');
  }

  private async restoreRuntimeSessionFromToken(
    tokenData: TokenData,
    getDeviceInfo: () => DeviceInfoClientDTO,
  ): Promise<AuthSession> {
    const deviceInfo = getDeviceInfo();
    const device = DeviceInfo.create(toDeviceInfoDTO(deviceInfo));
    const expiresAt = Math.max(tokenData.accessTokenExpiresAt, tokenData.refreshTokenExpiresAt);

    const session = AuthSession.create({
      id: tokenData.sessionId as unknown as AuthSessionId,
      identityId: toIdentityId(tokenData.identityId),
      refreshTokenHash: generateUUID(),
      expiresAt,
      deviceInfo: device.toDTO(),
    });

    try {
      await this.sessionRepository.save(session);
    } catch (error) {
      this.logger.warn('Failed to persist reconstructed session, keeping runtime-only session', {
        error,
        sessionId: tokenData.sessionId,
      });
    }

    return session;
  }
}

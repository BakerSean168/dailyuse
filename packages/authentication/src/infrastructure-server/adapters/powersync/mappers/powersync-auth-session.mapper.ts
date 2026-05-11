import type {
  AuthSessionId,
  DeviceInfo as IDeviceInfo,
  DeviceType as IDeviceType,
} from '@dailyuse/contracts/authentication';
import { AuthSession } from '../../../../domain-server';
import type { AuthSessionState } from '../../../../domain-server';
import { DeviceInfo, SessionStatus } from '../../../../domain-shared';
import type { IdentityId } from '@dailyuse/domain-shared/shared';

export interface PowerSyncAuthSessionRow {
  id: string;
  identity_id: string;
  refresh_token_hash: string | null;
  device_id: string;
  device_fingerprint: string;
  device_type: string;
  device_name: string | null;
  os: string | null;
  browser: string | null;
  ip_address: string | null;
  location: string | null;
  version: number;
  created_at: string;
  expires_at: string;
  last_active_at: string;
  deleted_at: string | null;
}

export interface PowerSyncAuthSessionWriteData {
  id: string;
  identity_id: string;
  refresh_token_hash: string | null;
  device_id: string;
  device_fingerprint: string;
  device_type: string;
  device_name: string | null;
  os: string | null;
  browser: string | null;
  ip_address: string | null;
  location: string | null;
  version: number;
  created_at: string;
  expires_at: string;
  last_active_at: string;
  deleted_at: string | null;
}

function toIso(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return new Date(value).toISOString();
}

export class PowerSyncAuthSessionMapper {
  static toDomain(row: PowerSyncAuthSessionRow): AuthSession {
    return AuthSession.load(this.toState(row));
  }

  static toState(row: PowerSyncAuthSessionRow): AuthSessionState {
    const geoLocation = row.location
      ? (JSON.parse(row.location) as {
          country?: string | null;
          region?: string | null;
          city?: string | null;
          timezone?: string | null;
        })
      : null;

    const deviceInfoDTO: IDeviceInfo = {
      deviceId: row.device_id,
      deviceFingerprint: row.device_fingerprint,
      deviceType: row.device_type as IDeviceType,
      deviceName: row.device_name ?? null,
      os: row.os ?? null,
      osVersion: null,
      browser: row.browser ?? null,
      appVersion: null,
      ipAddress: row.ip_address ?? null,
      userAgent: null,
      location: geoLocation
        ? {
            country: geoLocation.country ?? null,
            region: geoLocation.region ?? null,
            city: geoLocation.city ?? null,
            timezone: geoLocation.timezone ?? null,
          }
        : null,
      firstSeenAt: new Date(row.created_at).getTime(),
      lastSeenAt: new Date(row.last_active_at).getTime(),
    };

    const isRevoked = row.deleted_at != null;
    const isExpired = new Date(row.expires_at).getTime() < Date.now();
    let status: typeof SessionStatus.Active;
    if (isRevoked) {
      status = SessionStatus.Revoked;
    } else if (isExpired) {
      status = SessionStatus.Expired;
    } else {
      status = SessionStatus.Active;
    }

    return {
      id: row.id as AuthSessionId,
      identityId: row.identity_id as IdentityId,
      deviceInfo: DeviceInfo.fromDTO(deviceInfoDTO),
      refreshTokenHash: row.refresh_token_hash ?? undefined,
      status,
      version: row.version,
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      lastActiveAt: new Date(row.last_active_at),
      isRevoked,
    };
  }

  static toPersistence(session: AuthSession): PowerSyncAuthSessionWriteData {
    const dto = session.toServerDTO();
    const deviceInfo = dto.deviceInfo;

    return {
      id: dto.id,
      identity_id: dto.identityId,
      refresh_token_hash: dto.refreshTokenHash ?? null,
      device_id: deviceInfo.deviceId,
      device_fingerprint: deviceInfo.deviceFingerprint,
      device_type: String(deviceInfo.deviceType),
      device_name: deviceInfo.deviceName ?? null,
      os: deviceInfo.os ?? null,
      browser: deviceInfo.browser ?? null,
      ip_address: deviceInfo.ipAddress ?? null,
      location: deviceInfo.location ? JSON.stringify(deviceInfo.location) : null,
      version: dto.version,
      created_at: toIso(dto.createdAt) ?? new Date().toISOString(),
      expires_at: toIso(dto.expiresAt) ?? new Date().toISOString(),
      last_active_at: toIso(dto.lastActiveAt) ?? new Date().toISOString(),
      deleted_at: dto.isRevoked ? new Date().toISOString() : null,
    };
  }
}

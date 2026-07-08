/**
 * Prisma AuthSession Mapper
 *
 * Bidirectional mapper:
 * - toDomain:      Prisma DB row -> AuthSessionState -> AuthSession aggregate root
 * - toPersistence: AuthSession aggregate root -> Prisma write data (flattened)
 *
 * Mapping notes:
 * - Prisma AuthSession has no status column; status is derived from deletedAt/expiresAt
 * - Prisma AuthSession has no token column; JWT is issued at runtime
 * - DeviceInfo value object is split into individual Prisma columns
 * - isRevoked maps to deletedAt (soft delete pattern)
 */

import type {
  DeviceInfo,
  DeviceType as IDeviceType,
  AuthSessionId,
} from '@dailyuse/contracts/authentication';
import { AuthSession } from '../../../../domain';
import type { AuthSessionState } from '../../../../domain';
import type { PrismaAuthSessionRow } from '../../../types';
import { SessionStatus, DeviceInfo as DeviceInfoVO } from '../../../../domain';
import type { IdentityId } from '@dailyuse/domain-shared/shared';

// ============ Write Data Type ============

/** Prisma write data for AuthSession (flattened DeviceInfo) */
export interface AuthSessionPrismaWriteData {
  id: string;
  identityId: string;
  refreshTokenHash: string | null;
  deviceId: string;
  deviceFingerprint: string;
  deviceType: string;
  deviceName: string | null;
  os: string | null;
  browser: string | null;
  ipAddress: string | null;
  location: Record<string, unknown> | undefined;
  version: number;
  createdAt: Date;
  expiresAt: Date;
  lastActiveAt: Date;
  deletedAt: Date | null;
}

// ============ Mapper ============

export class PrismaAuthSessionMapper {
  // ========== DB -> Domain ==========

  /**
   * Prisma row -> AuthSession aggregate root.
   *
   * Path: DB Row -> AuthSessionState -> AuthSession.load()
   */
  static toDomain(row: PrismaAuthSessionRow): AuthSession {
    return AuthSession.load(PrismaAuthSessionMapper.toState(row));
  }

  /**
   * Prisma row -> AuthSessionState.
   *
   * Core conversion logic:
   * - Reconstructs DeviceInfo value object from individual columns
   * - Derives session status from deletedAt/expiresAt
   */
  static toState(row: PrismaAuthSessionRow): AuthSessionState {
    const geoLocation = row.location as {
      country?: string | null;
      region?: string | null;
      city?: string | null;
      timezone?: string | null;
    } | null;

    // Reconstruct DeviceInfo value object from individual Prisma columns
    const deviceInfoDTO: DeviceInfo = {
      deviceId: row.deviceId,
      deviceFingerprint: row.deviceFingerprint,
      deviceType: row.deviceType as IDeviceType,
      deviceName: row.deviceName ?? null,
      os: row.os ?? null,
      osVersion: null,
      browser: row.browser ?? null,
      appVersion: null,
      ipAddress: row.ipAddress ?? null,
      userAgent: null,
      location: geoLocation
        ? {
            country: geoLocation.country ?? null,
            region: geoLocation.region ?? null,
            city: geoLocation.city ?? null,
            timezone: geoLocation.timezone ?? null,
          }
        : null,
      firstSeenAt: row.createdAt.getTime(),
      lastSeenAt: row.lastActiveAt.getTime(),
    };

    // Derive session status from Prisma state (no status column in DB)
    const isRevoked = row.deletedAt != null;
    const isExpired = row.expiresAt.getTime() < Date.now();
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
      identityId: row.identityId as IdentityId,
      deviceInfo: DeviceInfoVO.fromDTO(deviceInfoDTO),
      refreshTokenHash: row.refreshTokenHash ?? undefined,
      status,
      version: row.version,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      lastActiveAt: row.lastActiveAt,
      isRevoked,
    };
  }

  // ========== Domain -> DB ==========

  /**
   * AuthSession aggregate root -> Prisma write data.
   *
   * Path: AuthSession.toServerDTO() -> Prisma write data
   * - Converts number (timestamp) to Date
   * - Flattens DeviceInfo into individual columns
   * - Maps isRevoked to deletedAt
   */
  static toPersistence(session: AuthSession): AuthSessionPrismaWriteData {
    const dto = session.toServerDTO();
    const deviceInfo = dto.deviceInfo;

    return {
      id: dto.id,
      identityId: dto.identityId,
      refreshTokenHash: dto.refreshTokenHash ?? null,
      deviceId: deviceInfo.deviceId,
      deviceFingerprint: deviceInfo.deviceFingerprint,
      deviceType: String(deviceInfo.deviceType),
      deviceName: deviceInfo.deviceName ?? null,
      os: deviceInfo.os ?? null,
      browser: deviceInfo.browser ?? null,
      ipAddress: deviceInfo.ipAddress ?? null,
      location: deviceInfo.location ? (deviceInfo.location as Record<string, unknown>) : undefined,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      expiresAt: new Date(dto.expiresAt),
      lastActiveAt: new Date(dto.lastActiveAt),
      deletedAt: dto.isRevoked ? new Date() : null,
    };
  }
}

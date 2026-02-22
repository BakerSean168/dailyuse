/**
 * Prisma AuthSession Mapper
 *
 * 双向映射：
 * - toDomain:  Prisma DB row → AuthSessionState → AuthSession 聚合根
 * - toPersistence: AuthSession 聚合根 → Prisma write data (扁平行)
 *
 * 特殊映射说明：
 * - Prisma AuthSession 无 status 列，状态从 deletedAt / expiresAt 推导
 * - Prisma AuthSession 无 token 列，JWT 在运行时签发
 * - DeviceInfo 值对象拆分为多个 Prisma 独立列
 * - isRevoked 映射到 deletedAt（软删除模式）
 */

import type {
  DeviceInfo,
} from '@dailyuse/contracts/authentication';
import { AuthSession } from '../../../domain-server';
import type { AuthSessionState } from '../../../domain-server';
import type { PrismaAuthSessionRow } from '../../types';
import {
  SessionStatus,
  DeviceInfo as DeviceInfoVO,
} from '../../../domain-shared';
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
  // ========== DB → Domain ==========

  /**
   * Prisma row → AuthSession 聚合根
   *
   * 路径：DB Row → AuthSessionState → AuthSession.load()
   */
  static toDomain(row: PrismaAuthSessionRow): AuthSession {
    return AuthSession.load(PrismaAuthSessionMapper.toState(row));
  }

  /**
   * Prisma row → AuthSessionState
   *
   * 核心转换：
   * - 从多个独立列重组 DeviceInfo 值对象
   * - 从 deletedAt/expiresAt 推导 session status
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
      deviceType: row.deviceType,
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
    let status: typeof SessionStatus.ACTIVE;
    if (isRevoked) {
      status = SessionStatus.REVOKED;
    } else if (isExpired) {
      status = SessionStatus.EXPIRED;
    } else {
      status = SessionStatus.ACTIVE;
    }

    return {
      id: row.id,
      identityId: row.identityId as IdentityId,
      deviceInfo: DeviceInfoVO.fromDTO(deviceInfoDTO),
      refreshTokenHash: row.refreshTokenHash ?? undefined,
      status,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      lastActiveAt: row.lastActiveAt,
      isRevoked,
    };
  }

  // ========== Domain → DB ==========

  /**
   * AuthSession 聚合根 → Prisma 写入数据
   *
   * 路径：AuthSession.toServerDTO() → Prisma write data
   * - number (timestamp) → Date 转换
   * - DeviceInfo → 多个独立列
   * - isRevoked → deletedAt
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
      location: deviceInfo.location
        ? (deviceInfo.location as Record<string, unknown>)
        : undefined,
      version: 1,
      createdAt: new Date(dto.createdAt),
      expiresAt: new Date(dto.expiresAt),
      lastActiveAt: new Date(dto.lastActiveAt),
      deletedAt: dto.isRevoked ? new Date() : null,
    };
  }
}

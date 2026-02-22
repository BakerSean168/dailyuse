/**
 * Prisma AuthSession Mapper
 *
 * 双向映射：
 * - toDomain:  Prisma DB row → AuthSessionServerDTO → AuthSession 聚合根
 * - toPersistence: AuthSession 聚合根 → Prisma write data (扁平行)
 *
 * 特殊映射说明：
 * - Prisma AuthSession 无 status 列，状态从 deletedAt / expiresAt 推导
 * - Prisma AuthSession 无 token 列，JWT 在运行时签发
 * - DeviceInfo 值对象拆分为多个 Prisma 独立列
 * - isRevoked 映射到 deletedAt（软删除模式）
 *
 * PersistenceDTO 已移除，mapper 直接在 DB Row ↔ ServerDTO 之间转换
 */

import type {
  AuthSessionServerDTO,
  DeviceInfo,
} from '@dailyuse/contracts/authentication';
import { AuthSession } from '../../../domain-server';
import type { PrismaAuthSessionRow } from '../../types';

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
   * 路径：DB Row → ServerDTO → AuthSession.fromServerDTO()
   */
  static toDomain(row: PrismaAuthSessionRow): AuthSession {
    return AuthSession.fromServerDTO(PrismaAuthSessionMapper.toServerDTO(row));
  }

  /**
   * Prisma row → AuthSessionServerDTO
   *
   * 核心转换：
   * - 从多个独立列重组 DeviceInfo 值对象
   * - 从 deletedAt/expiresAt 推导 session status
   * - Date → number (timestamp) 转换
   */
  static toServerDTO(row: PrismaAuthSessionRow): AuthSessionServerDTO {
    const geoLocation = row.location as {
      country?: string | null;
      region?: string | null;
      city?: string | null;
      timezone?: string | null;
    } | null;

    // Reconstruct DeviceInfo value object from individual Prisma columns
    const deviceInfo: DeviceInfo = {
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
    let status: string;
    if (isRevoked) {
      status = 'REVOKED';
    } else if (isExpired) {
      status = 'EXPIRED';
    } else {
      status = 'ACTIVE';
    }

    return {
      id: row.id,
      identityId: row.identityId,
      deviceInfo,
      refreshTokenHash: row.refreshTokenHash ?? undefined,
      status: status as AuthSessionServerDTO['status'],
      createdAt: row.createdAt.getTime(),
      expiresAt: row.expiresAt.getTime(),
      lastActiveAt: row.lastActiveAt.getTime(),
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

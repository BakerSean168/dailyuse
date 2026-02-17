/**
 * PrismaAuthSessionRepository
 *
 * Prisma implementation of IAuthSessionRepository.
 * Uses constructor-injected PrismaClient from @dailyuse/database.
 *
 * Mapping notes:
 * - Prisma AuthSession has no `status` column; status is derived from deletedAt / expiresAt
 * - Prisma AuthSession has no `token` column; JWTs are issued at runtime, not persisted
 * - DeviceInfo value object is decomposed into individual Prisma columns
 * - `isRevoked` maps to `deletedAt` (soft-delete pattern)
 * 
 * Extends AggregateRepositoryBase to automatically publish domain events after persistence.
 */

import type { PrismaClient } from '@dailyuse/database';
import type { AuthSessionPersistenceDTO, DeviceInfo } from '@dailyuse/contracts/authentication';
import type { IAuthSessionRepository } from '../../domain-server';
import { AuthSession } from '../../domain-server';
import { createLogger } from '@dailyuse/utils';
import { AggregateRepositoryBase, type IEventBus } from '@dailyuse/patterns';

const logger = createLogger('PrismaAuthSessionRepository');

/**
 * Prisma-based AuthSession Repository
 * 
 * 自动发送领域事件：
 * - 聚合根内的业务函数创建事件（通过 addDomainEvent）
 * - save() 方法先持久化，再自动发布所有领域事件
 * - 事件发布失败不会回滚事务，但会记录错误
 */
export class PrismaAuthSessionRepository
  extends AggregateRepositoryBase<AuthSession>
  implements IAuthSessionRepository
{
  constructor(
    private readonly prisma: PrismaClient,
    eventBus: IEventBus
  ) {
    super(eventBus);
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(session: AuthSession): Promise<void> {
    try {
      const dto = session.toPersistenceDTO();
      const deviceInfo = dto.deviceInfo;

      await this.prisma.authSession.upsert({
        where: { id: dto.id },
        create: {
          id: dto.id,
          identityId: dto.identityId,
          refreshTokenHash: dto.refreshTokenHash ?? null,
          // Decompose DeviceInfo into individual columns
          deviceId: deviceInfo.deviceId,
          deviceFingerprint: deviceInfo.deviceFingerprint,
          deviceType: String(deviceInfo.deviceType),
          deviceName: deviceInfo.deviceName ?? null,
          os: deviceInfo.os ?? null,
          browser: deviceInfo.browser ?? null,
          ipAddress: deviceInfo.ipAddress ?? null,
          location: deviceInfo.location ?? undefined,
          version: 1,
          createdAt: dto.createdAt,
          expiresAt: dto.expiresAt,
          lastActiveAt: dto.lastActiveAt,
          deletedAt: dto.isRevoked ? new Date() : null,
        },
        update: {
          refreshTokenHash: dto.refreshTokenHash ?? null,
          // Update mutable device fields
          deviceName: deviceInfo.deviceName ?? null,
          os: deviceInfo.os ?? null,
          browser: deviceInfo.browser ?? null,
          ipAddress: deviceInfo.ipAddress ?? null,
          location: deviceInfo.location ?? undefined,
          expiresAt: dto.expiresAt,
          lastActiveAt: dto.lastActiveAt,
          deletedAt: dto.isRevoked ? new Date() : null,
        },
      });

      logger.debug('[PrismaAuthSessionRepository] Session saved', { id: dto.id });
    } catch (error) {
      logger.error('[PrismaAuthSessionRepository] Save failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findById(id: string): Promise<AuthSession | null> {
    const row = await this.prisma.authSession.findUnique({
      where: { id },
    });

    if (!row) return null;
    return AuthSession.fromPersistenceDTO(this.mapRowToDTO(row));
  }

  async findByIdentityId(identityId: string): Promise<AuthSession[]> {
    const rows = await this.prisma.authSession.findMany({
      where: { identityId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row: any) => AuthSession.fromPersistenceDTO(this.mapRowToDTO(row)));
  }

  async remove(session: AuthSession): Promise<void> {
    // Soft-delete via deletedAt
    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { deletedAt: new Date() },
    });
  }

  async removeAllByIdentityId(identityId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { identityId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async removeExpired(): Promise<void> {
    // Soft-delete sessions that have passed their expiration time
    await this.prisma.authSession.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Map a Prisma row to AuthSessionPersistenceDTO.
   * Reconstructs DeviceInfo from individual columns and derives status from DB state.
   */
  private mapRowToDTO(row: any): AuthSessionPersistenceDTO {
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
      osVersion: null,   // Not stored in individual Prisma columns
      browser: row.browser ?? null,
      appVersion: null,  // Not stored in individual Prisma columns
      ipAddress: row.ipAddress ?? null,
      userAgent: null,   // Not stored in individual Prisma columns
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
      status: status as AuthSessionPersistenceDTO['status'],
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      lastActiveAt: row.lastActiveAt,
      isRevoked,
    };
  }
}

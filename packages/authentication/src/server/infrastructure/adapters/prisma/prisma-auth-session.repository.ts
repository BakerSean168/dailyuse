/**
 * PrismaAuthSessionRepository
 *
 * Prisma implementation of IAuthSessionRepository.
 * Mapping logic is delegated to PrismaAuthSessionMapper.
 *
 * Extends AggregateRepositoryBase to automatically publish domain events after persistence.
 */

import type { PrismaClient, AuthSession as PrismaAuthSession, Prisma } from '@dailyuse/database';
import type { IAuthSessionRepository } from '../../../domain';
import { AuthSession } from '../../../domain';
import { createLogger } from '@dailyuse/utils/logger';
import { AggregateRepositoryBase, type IEventBus } from '@dailyuse/patterns';
import { PrismaAuthSessionMapper } from './mappers';
import type { PrismaAuthSessionRow } from '../../types';

const logger = createLogger('PrismaAuthSessionRepository');

/**
 * AuthSession Prisma Repository
 */
export class PrismaAuthSessionRepository
  extends AggregateRepositoryBase<AuthSession>
  implements IAuthSessionRepository
{
  constructor(
    private readonly prisma: PrismaClient,
    eventBus: IEventBus,
  ) {
    super(eventBus);
  }

  // ================= Write Operations =================

  protected async persist(session: AuthSession): Promise<void> {
    try {
      const data = PrismaAuthSessionMapper.toPersistence(session);

      await this.prisma.authSession.upsert({
        where: { id: data.id },
        create: {
          id: data.id,
          identityId: data.identityId,
          refreshTokenHash: data.refreshTokenHash,
          deviceId: data.deviceId,
          deviceFingerprint: data.deviceFingerprint,
          deviceType: data.deviceType,
          deviceName: data.deviceName,
          os: data.os,
          browser: data.browser,
          ipAddress: data.ipAddress,
          location: data.location as Prisma.InputJsonValue | undefined,
          version: data.version,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          lastActiveAt: data.lastActiveAt,
          deletedAt: data.deletedAt,
        },
        update: {
          refreshTokenHash: data.refreshTokenHash,
          deviceName: data.deviceName,
          os: data.os,
          browser: data.browser,
          ipAddress: data.ipAddress,
          location: data.location as Prisma.InputJsonValue | undefined,
          expiresAt: data.expiresAt,
          lastActiveAt: data.lastActiveAt,
          deletedAt: data.deletedAt,
        },
      });

      logger.debug('[PrismaAuthSessionRepository] Session saved', { id: data.id });
    } catch (error) {
      logger.error('[PrismaAuthSessionRepository] Save failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ================= Read Operations =================

  async findById(id: string): Promise<AuthSession | null> {
    const row = await this.prisma.authSession.findUnique({
      where: { id },
    });
    if (!row) return null;
    return PrismaAuthSessionMapper.toDomain(row as PrismaAuthSessionRow);
  }

  async findByIdentityId(identityId: string): Promise<AuthSession[]> {
    const rows = await this.prisma.authSession.findMany({
      where: { identityId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row: PrismaAuthSession) =>
      PrismaAuthSessionMapper.toDomain(row as PrismaAuthSessionRow),
    );
  }

  // ================= Delete Operations =================

  async remove(session: AuthSession): Promise<void> {
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
    await this.prisma.authSession.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
  }
}

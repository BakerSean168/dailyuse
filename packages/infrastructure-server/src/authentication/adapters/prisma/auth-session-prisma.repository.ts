/**
 * AuthSession Prisma Repository
 *
 * Prisma implementation of IAuthSessionRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 * Migrated from apps/api/src/modules/authentication/infrastructure
 */

import type { PrismaClient } from '../../../generated/prisma/client';
import type { authSession as PrismaAuthSession } from '../../../generated/prisma/client';
import type { IAuthSessionRepository } from '../../ports/auth-session-repository.port';
import { AuthSession } from '@dailyuse/domain-server/authentication';
import type { AuthSessionPersistenceDTO } from '@dailyuse/contracts/authentication';
import { SessionStatus } from '@dailyuse/contracts/authentication';

type PrismaTransactionClient = any;

export class AuthSessionPrismaRepository implements IAuthSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapToEntity(data: PrismaAuthSession): AuthSession {
    const device = JSON.parse(data.device);
    const location = data.userAgent ? JSON.parse(data.userAgent) : null;

    const persistenceDTO: AuthSessionPersistenceDTO = {
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      accessToken: data.accessToken,
      accessTokenExpiresAt: data.accessTokenExpiresAt.getTime(),
      refreshToken: data.refreshToken,
      refreshTokenExpiresAt: data.refreshTokenExpiresAt.getTime(),
      deviceId: device.deviceId,
      deviceType: device.deviceType,
      deviceOs: device.os,
      deviceBrowser: device.browser,
      status: data.status as SessionStatus,
      ipAddress: data.ipAddress ?? '',
      locationCountry: location?.country,
      locationRegion: location?.region,
      locationCity: location?.city,
      locationTimezone: location?.timezone,
      lastActivityAt: data.lastAccessedAt.getTime(),
      history: data.history,
      createdAt: data.createdAt.getTime(),
      expiresAt: data.refreshTokenExpiresAt.getTime(),
      revokedAt: data.revokedAt?.getTime(),
    };
    return AuthSession.fromPersistenceDTO(persistenceDTO);
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  async save(session: AuthSession, tx?: PrismaTransactionClient): Promise<void> {
    try {
      const client = tx || this.prisma;
      const persistence = session.toPersistenceDTO();
      const {
        uuid,
        accountUuid,
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
        status,
        ipAddress,
        history,
        lastActivityAt,
        revokedAt,
      } = persistence;

      const device = JSON.stringify({
        deviceId: persistence.deviceId,
        deviceType: persistence.deviceType,
        os: persistence.deviceOs,
        browser: persistence.deviceBrowser,
      });

      const userAgent = JSON.stringify({
        country: persistence.locationCountry,
        region: persistence.locationRegion,
        city: persistence.locationCity,
        timezone: persistence.locationTimezone,
      });

      const dataForPrisma = {
        uuid,
        accountUuid,
        status,
        accessToken,
        accessTokenExpiresAt: new Date(accessTokenExpiresAt),
        refreshToken,
        refreshTokenExpiresAt: new Date(refreshTokenExpiresAt),
        device,
        ipAddress,
        userAgent,
        history,
        lastAccessedAt: new Date(lastActivityAt),
        revokedAt: this.toDate(revokedAt),
      };

      await client.authSession.upsert({
        where: { uuid },
        create: {
          ...dataForPrisma,
          createdAt: new Date(persistence.createdAt),
          updatedAt: new Date(),
        },
        update: {
          ...dataForPrisma,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[AuthSessionPrismaRepository] Save session failed:', {
        uuid: session.uuid,
        accountUuid: session.accountUuid,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Session save failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findByUuid(uuid: string, tx?: PrismaTransactionClient): Promise<AuthSession | null> {
    const client = tx || this.prisma;
    const data = await client.authSession.findUnique({ where: { uuid } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    const client = tx || this.prisma;
    const sessions = await client.authSession.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((s: PrismaAuthSession) => this.mapToEntity(s));
  }

  async findByAccessToken(accessToken: string, tx?: PrismaTransactionClient): Promise<AuthSession | null> {
    const client = tx || this.prisma;
    const data = await client.authSession.findUnique({ where: { accessToken } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByRefreshToken(refreshToken: string, tx?: PrismaTransactionClient): Promise<AuthSession | null> {
    const client = tx || this.prisma;
    const data = await client.authSession.findUnique({ where: { refreshToken } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByDeviceId(deviceId: string, tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    const client = tx || this.prisma;
    const sessions = await client.authSession.findMany({
      where: { device: { contains: `"deviceId":"${deviceId}"` } },
    });
    return sessions.map((s: PrismaAuthSession) => this.mapToEntity(s));
  }

  async findActiveSessions(accountUuid: string, tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    const client = tx || this.prisma;
    const sessions = await client.authSession.findMany({
      where: {
        accountUuid,
        status: 'ACTIVE',
        accessTokenExpiresAt: { gt: new Date() },
      },
      orderBy: { lastAccessedAt: 'desc' },
    });
    return sessions.map((s: PrismaAuthSession) => this.mapToEntity(s));
  }

  async findActiveSessionsByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    return this.findActiveSessions(accountUuid, tx);
  }

  async findAll(params?: { skip?: number; take?: number }, tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    const client = tx || this.prisma;
    const sessions = await client.authSession.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((s: PrismaAuthSession) => this.mapToEntity(s));
  }

  async findByStatus(
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED',
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthSession[]> {
    const client = tx || this.prisma;
    const sessions = await client.authSession.findMany({
      where: { status },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((s: PrismaAuthSession) => this.mapToEntity(s));
  }

  async delete(uuid: string, tx?: PrismaTransactionClient): Promise<void> {
    const client = tx || this.prisma;
    await client.authSession.delete({ where: { uuid } });
  }

  async deleteByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<number> {
    const client = tx || this.prisma;
    const result = await client.authSession.deleteMany({ where: { accountUuid } });
    return result.count;
  }

  async deleteExpired(tx?: PrismaTransactionClient): Promise<number> {
    const client = tx || this.prisma;
    const result = await client.authSession.deleteMany({
      where: {
        OR: [{ status: 'EXPIRED' }, { accessTokenExpiresAt: { lt: new Date() } }],
      },
    });
    return result.count;
  }
}

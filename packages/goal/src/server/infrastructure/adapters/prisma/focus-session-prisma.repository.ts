import type { PrismaClient, FocusSession as PrismaFocusSession, Prisma } from '@dailyuse/database';
import type { IFocusSessionRepository } from '../../../domain';
import { FocusSession } from '../../../domain';
import { FocusSessionStatus } from '@dailyuse/contracts/goal';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils/domain';
import { PrismaFocusSessionMapper } from './mappers/prisma-focus-session-mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

/**
 * FocusSession Prisma Repository
 *
 * Prisma implementation of IFocusSessionRepository.
 * Maps between Domain Entity and Prisma Model.
 */
export class FocusSessionPrismaRepository
  extends AggregateRepositoryBase<FocusSession>
  implements IFocusSessionRepository
{
  constructor(private prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  /**
   * Map Prisma row to domain entity
   */
  private mapToEntity(data: PrismaFocusSession): FocusSession {
    return PrismaFocusSessionMapper.toDomain(data);
  }

  /**
   * Save domain entity to database (upsert)
   */
  protected async persist(session: FocusSession): Promise<void> {
    const dto = session.toServerDTO();

    const updateData = {
      goalId: dto.goalId ? (dto.goalId as string) : null,
      status: dto.status,
      durationMinutes: dto.durationMinutes,
      actualDurationMinutes: dto.actualDurationMinutes,
      description: dto.description,
      startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
      pausedAt: dto.pausedAt ? new Date(dto.pausedAt) : null,
      resumedAt: dto.resumedAt ? new Date(dto.resumedAt) : null,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      cancelledAt: dto.cancelledAt ? new Date(dto.cancelledAt) : null,
      pauseCount: dto.pauseCount,
      pausedDurationMinutes: dto.pausedDurationMinutes,
      version: dto.version,
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    };

    await this.prisma.focusSession.upsert({
      where: { id: dto.id as string },
      create: {
        id: dto.id as string,
        identityId: dto.identityId as string,
        createdAt: new Date(dto.createdAt),
        ...updateData,
      },
      update: updateData,
    });
  }

  async findByIdForIdentity(identityId: string, id: string): Promise<FocusSession | null> {
    const data = await this.prisma.focusSession.findFirst({
      where: { id, identityId },
    });
    return data ? this.mapToEntity(data) : null;
  }

  /**
   * Find active session for user (Active status)
   */
  async findActiveSession(identityId: string): Promise<FocusSession | null> {
    const data = await this.prisma.focusSession.findFirst({
      where: {
        identityId,
        status: FocusSessionStatus.Active,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data ? this.mapToEntity(data) : null;
  }

  /**
   * Find sessions by identity
   */
  async findByIdentityId(
    identityId: string,
    options?: {
      goalId?: string | null;
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'startedAt' | 'completedAt' | 'updatedAt';
      orderDirection?: 'asc' | 'desc';
    },
  ): Promise<FocusSession[]> {
    const where: Prisma.FocusSessionWhereInput = { identityId, deletedAt: null };

    if (options?.goalId) {
      where.goalId = options.goalId;
    }

    if (options?.status && options.status.length > 0) {
      where.status = { in: options.status };
    }

    const orderByField = options?.orderBy || 'createdAt';
    const orderDirection = options?.orderDirection || 'desc';

    const data = await this.prisma.focusSession.findMany({
      where,
      orderBy: { [orderByField]: orderDirection },
      skip: options?.offset,
      take: options?.limit,
    });

    return data.map((d: PrismaFocusSession) => this.mapToEntity(d));
  }

  /**
   * Find sessions by goal ID
   */
  async findByGoalId(
    identityId: string,
    goalId: string,
    options?: {
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
    },
  ): Promise<FocusSession[]> {
    const where: Prisma.FocusSessionWhereInput = { identityId, goalId, deletedAt: null };

    if (options?.status && options.status.length > 0) {
      where.status = { in: options.status };
    }

    const data = await this.prisma.focusSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: options?.offset,
      take: options?.limit,
    });

    return data.map((d: PrismaFocusSession) => this.mapToEntity(d));
  }

  /**
   * Delete session
   */
  async delete(identityId: string, id: string): Promise<void> {
    const result = await this.prisma.focusSession.deleteMany({
      where: { id, identityId },
    });
    if (result.count === 0) {
      throw new Error('Focus session not found for the current identity.');
    }
  }

  /**
   * Check if session exists
   */
  async exists(identityId: string, id: string): Promise<boolean> {
    const count = await this.prisma.focusSession.count({
      where: { id, identityId },
    });
    return count > 0;
  }

  /**
   * Count sessions by identity
   */
  async count(
    identityId: string,
    options?: {
      status?: FocusSessionStatus[];
      startDate?: number;
      endDate?: number;
    },
  ): Promise<number> {
    const where: Prisma.FocusSessionWhereInput = { identityId };

    if (options?.status && options.status.length > 0) {
      where.status = { in: options.status };
    }

    if (options?.startDate || options?.endDate) {
      const createdAtFilter: Prisma.DateTimeFilter = {};
      if (options?.startDate) {
        createdAtFilter.gte = new Date(options.startDate);
      }
      if (options?.endDate) {
        createdAtFilter.lte = new Date(options.endDate);
      }
      where.createdAt = createdAtFilter;
    }

    return this.prisma.focusSession.count({ where });
  }
}

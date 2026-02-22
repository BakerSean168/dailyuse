import type { PrismaClient, FocusSession as PrismaFocusSession, Prisma } from '@dailyuse/database';
import type { IFocusSessionRepository } from '@/domain-server';
import { FocusSession } from '@/domain-server';
import { FocusSessionStatus } from '@dailyuse/contracts/goal';
import type { FocusSessionPersistenceDTO } from '@dailyuse/contracts/goal';

/**
 * FocusSession Prisma Repository
 *
 * Prisma implementation of IFocusSessionRepository.
 * Maps between Domain Entity and Prisma Model.
 */
export class FocusSessionPrismaRepository implements IFocusSessionRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Map Prisma row to domain entity
   */
  private mapToEntity(data: PrismaFocusSession): FocusSession {
    const dto: FocusSessionPersistenceDTO = {
      id: data.id,
      identityId: data.identityId,
      goalId: data.goalId ?? null,
      status: data.status as FocusSessionStatus,
      durationMinutes: data.durationMinutes,
      actualDurationMinutes: data.actualDurationMinutes,
      description: data.description,
      startedAt: data.startedAt ?? null,
      pausedAt: data.pausedAt ?? null,
      resumedAt: data.resumedAt ?? null,
      completedAt: data.completedAt ?? null,
      cancelledAt: data.cancelledAt ?? null,
      pauseCount: data.pauseCount,
      pausedDurationMinutes: data.pausedDurationMinutes,
      version: data.version ?? 1,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    };
    return FocusSession.fromPersistenceDTO(dto);
  }

  /**
   * Save domain entity to database (upsert)
   */
  async save(session: FocusSession): Promise<void> {
    const dto = session.toPersistenceDTO();

    const updateData = {
      goalId: dto.goalId ? (dto.goalId as string) : null,
      status: dto.status,
      durationMinutes: dto.durationMinutes,
      actualDurationMinutes: dto.actualDurationMinutes,
      description: dto.description,
      startedAt: dto.startedAt,
      pausedAt: dto.pausedAt,
      resumedAt: dto.resumedAt,
      completedAt: dto.completedAt,
      cancelledAt: dto.cancelledAt,
      pauseCount: dto.pauseCount,
      pausedDurationMinutes: dto.pausedDurationMinutes,
      version: dto.version,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt ?? null,
    };

    await this.prisma.focusSession.upsert({
      where: { id: dto.id as string },
      create: {
        id: dto.id as string,
        identityId: dto.identityId as string,
        createdAt: dto.createdAt,
        ...updateData,
      },
      update: updateData,
    });
  }

  /**
   * Find session by ID
   */
  async findById(id: string): Promise<FocusSession | null> {
    const data = await this.prisma.focusSession.findUnique({
      where: { id },
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
    goalId: string,
    options?: {
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
    },
  ): Promise<FocusSession[]> {
    const where: Prisma.FocusSessionWhereInput = { goalId, deletedAt: null };

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
  async delete(id: string): Promise<void> {
    await this.prisma.focusSession.delete({
      where: { id },
    });
  }

  /**
   * Check if session exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.focusSession.count({
      where: { id },
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
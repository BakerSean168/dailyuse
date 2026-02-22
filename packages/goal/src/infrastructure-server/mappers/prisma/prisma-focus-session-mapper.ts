/**
 * Prisma FocusSession Mapper
 *
 * Maps between FocusSession domain entity and Prisma model.
 */

import type { FocusSession as PrismaFocusSession } from '@dailyuse/database';
import { FocusSessionStatus } from '@dailyuse/contracts/goal';
import { FocusSession } from '@/domain-server';
import { IdentityId } from '@dailyuse/domain-shared';
import { FocusSessionId, GoalId } from '@/domain-shared';

export class PrismaFocusSessionMapper {
  /**
   * Prisma row → Domain FocusSession entity
   */
  static toDomain(data: PrismaFocusSession): FocusSession {
    return FocusSession.load({
      id: FocusSessionId.of(data.id),
      identityId: IdentityId.of(data.identityId),
      goalId: data.goalId ? GoalId.of(data.goalId) : null,
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
    });
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaFocusSession[]): FocusSession[] {
    return rows.map((row) => PrismaFocusSessionMapper.toDomain(row));
  }
}

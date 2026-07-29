/**
 * Prisma FocusSession Mapper
 *
 * Maps between FocusSession domain entity and Prisma model.
 */

import type { FocusSession as PrismaFocusSession } from '@memoflow/database';
import { FocusSessionStatus } from '@memoflow/contracts/goal';
import { FocusSession } from '../../../../domain';
import { IdentityId } from '@memoflow/domain-shared';
import { FocusSessionId, GoalId } from '../../../../domain';

/** Prisma Date/DateTime → Instant (epoch ms). Required fields never null. */
function requiredInstant(value: Date | string | number | null | undefined): number {
  if (value instanceof Date) return value.getTime();
  if (value == null) return Date.now();
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : Date.now();
}

/** Prisma Date/DateTime → Instant | null. */
function optionalInstant(value: Date | string | number | null | undefined): number | null {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}


export class PrismaFocusSessionMapper {
  /** Maps a Prisma row to a Domain FocusSession entity. */
  static toDomain(data: PrismaFocusSession): FocusSession {
    return FocusSession.load({
      id: FocusSessionId.of(data.id),
      identityId: IdentityId.of(data.identityId),
      goalId: data.goalId ? GoalId.of(data.goalId) : null,
      status: data.status as FocusSessionStatus,
      durationMinutes: data.durationMinutes,
      actualDurationMinutes: data.actualDurationMinutes,
      description: data.description,
      startedAt: optionalInstant(data.startedAt),
      pausedAt: optionalInstant(data.pausedAt),
      resumedAt: optionalInstant(data.resumedAt),
      completedAt: optionalInstant(data.completedAt),
      cancelledAt: optionalInstant(data.cancelledAt),
      pauseCount: data.pauseCount,
      pausedDurationMinutes: data.pausedDurationMinutes,
      version: data.version ?? 1,
      createdAt: requiredInstant(data.createdAt),
      updatedAt: requiredInstant(data.updatedAt),
      deletedAt: optionalInstant(data.deletedAt),
    });
  }

  /** Batch converts Prisma FocusSession rows to Domain entities. */
  static toDomainList(rows: PrismaFocusSession[]): FocusSession[] {
    return rows.map((row) => PrismaFocusSessionMapper.toDomain(row));
  }
}

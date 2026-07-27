/**
 * Prisma GoalRecord Mapper
 *
 * Maps between GoalRecord domain aggregate and Prisma model.
 */

import type { GoalRecord as PrismaGoalRecord } from '@dailyuse/database';
import { GoalRecord } from '../../../../domain';
import { GoalRecordId, KeyResultId } from '../../../../domain';
import { IdentityId } from '@dailyuse/domain-shared';

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


export class PrismaGoalRecordMapper {
  /** Maps a Prisma row to a Domain GoalRecord aggregate. */
  static toDomain(data: PrismaGoalRecord): GoalRecord {
    return GoalRecord.load({
      id: GoalRecordId.of(data.id),
      keyResultId: KeyResultId.of(data.keyResultId),
      identityId: IdentityId.of(data.identityId),
      value: data.value,
      note: data.note ?? null,
      recordedAt: requiredInstant(data.recordedAt),
      version: data.version ?? 1,
      createdAt: requiredInstant(data.createdAt),
      updatedAt: requiredInstant(data.updatedAt),
      deletedAt: optionalInstant(data.deletedAt),
    });
  }

  /** Batch converts Prisma GoalRecord rows to Domain aggregates. */
  static toDomainList(rows: PrismaGoalRecord[]): GoalRecord[] {
    return rows.map((row) => PrismaGoalRecordMapper.toDomain(row));
  }
}

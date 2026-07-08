/**
 * Prisma GoalRecord Mapper
 *
 * Maps between GoalRecord domain aggregate and Prisma model.
 */

import type { GoalRecord as PrismaGoalRecord } from '@dailyuse/database';
import { GoalRecord } from '../../../../domain';
import { GoalRecordId, KeyResultId } from '../../../../domain';
import { IdentityId } from '@dailyuse/domain-shared';

export class PrismaGoalRecordMapper {
  /** Maps a Prisma row to a Domain GoalRecord aggregate. */
  static toDomain(data: PrismaGoalRecord): GoalRecord {
    return GoalRecord.load({
      id: GoalRecordId.of(data.id),
      keyResultId: KeyResultId.of(data.keyResultId),
      identityId: IdentityId.of(data.identityId),
      value: data.value,
      note: data.note ?? null,
      recordedAt: data.recordedAt,
      version: data.version ?? 1,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });
  }

  /** Batch converts Prisma GoalRecord rows to Domain aggregates. */
  static toDomainList(rows: PrismaGoalRecord[]): GoalRecord[] {
    return rows.map((row) => PrismaGoalRecordMapper.toDomain(row));
  }
}

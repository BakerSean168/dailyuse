/**
 * Prisma GoalRecord Mapper
 *
 * Maps between GoalRecord domain aggregate and Prisma model.
 */

import type { GoalRecord as PrismaGoalRecord } from '@dailyuse/database';
import { GoalRecord } from '@/domain-server';
import { GoalRecordId, KeyResultId } from '@/domain-shared';

export class PrismaGoalRecordMapper {
  /**
   * Prisma row → Domain GoalRecord aggregate
   */
  static toDomain(data: PrismaGoalRecord): GoalRecord {
    return GoalRecord.load({
      id: GoalRecordId.of(data.id),
      keyResultId: KeyResultId.of(data.keyResultId),
      value: data.value,
      note: data.note ?? null,
      recordedAt: data.recordedAt,
      version: data.version ?? 1,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    });
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaGoalRecord[]): GoalRecord[] {
    return rows.map((row) => PrismaGoalRecordMapper.toDomain(row));
  }
}

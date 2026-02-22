/**
 * Prisma GoalRecord Mapper
 *
 * Maps between GoalRecord domain aggregate and Prisma model.
 */

import type { GoalRecord as PrismaGoalRecord } from '@dailyuse/database';
import type { GoalRecordPersistenceDTO } from '@dailyuse/contracts/goal';
import { GoalRecord } from '@/domain-server';

export class PrismaGoalRecordMapper {
  /**
   * Prisma row → Domain GoalRecord aggregate
   */
  static toDomain(data: PrismaGoalRecord): GoalRecord {
    const dto: GoalRecordPersistenceDTO = {
      id: data.id,
      keyResultId: data.keyResultId,
      value: data.value,
      note: data.note ?? null,
      recordedAt: data.recordedAt,
      version: data.version ?? 1,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
    };
    return GoalRecord.fromPersistenceDTO(dto);
  }

  /**
   * Batch conversion: Prisma → Domain
   */
  static toDomainList(rows: PrismaGoalRecord[]): GoalRecord[] {
    return rows.map((row) => PrismaGoalRecordMapper.toDomain(row));
  }
}

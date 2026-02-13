/**
 * GoalRecord Prisma Repository
 *
 * Implements IGoalRecordRepository using Prisma.
 * Handles CRUD operations for goal progress records.
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IGoalRecordRepository, GoalRecordQueryOptions } from '@/domain-server';
import { GoalRecord } from '@/domain-server';
import type { GoalRecordPersistenceDTO } from '@dailyuse/contracts/goal';

export class GoalRecordPrismaRepository implements IGoalRecordRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Map Prisma row to domain aggregate
   */
  private mapToEntity(data: any): GoalRecord {
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
   * Build Prisma where/orderBy/take from query options
   */
  private buildQueryOptions(options?: GoalRecordQueryOptions) {
    const where: any = {};
    if (options?.startTime) {
      where.recordedAt = { ...where.recordedAt, gte: options.startTime };
    }
    if (options?.endTime) {
      where.recordedAt = { ...where.recordedAt, lte: options.endTime };
    }

    const orderBy = { recordedAt: options?.orderBy ?? 'desc' };
    const take = options?.limit;

    return { where, orderBy, take };
  }

  /**
   * Find records by key result ID
   */
  async findByKeyResultId(keyResultId: string, options?: GoalRecordQueryOptions): Promise<GoalRecord[]> {
    const { where, orderBy, take } = this.buildQueryOptions(options);

    const data = await (this.prisma as any).goalRecord.findMany({
      where: { keyResultId, deletedAt: null, ...where },
      orderBy,
      ...(take ? { take } : {}),
    });

    return data.map((item: any) => this.mapToEntity(item));
  }

  /**
   * Find records by goal ID (via KeyResult relation)
   */
  async findByGoalId(goalId: string, options?: GoalRecordQueryOptions): Promise<GoalRecord[]> {
    const { where, orderBy, take } = this.buildQueryOptions(options);

    const data = await (this.prisma as any).goalRecord.findMany({
      where: {
        keyResult: { goalId },
        deletedAt: null,
        ...where,
      },
      orderBy,
      ...(take ? { take } : {}),
    });

    return data.map((item: any) => this.mapToEntity(item));
  }

  /**
   * Find records by multiple key result IDs, grouped by key result
   */
  async findByKeyResultIds(
    keyResultIds: string[],
    options?: GoalRecordQueryOptions,
  ): Promise<Map<string, GoalRecord[]>> {
    const { where, orderBy, take } = this.buildQueryOptions(options);

    const data = await (this.prisma as any).goalRecord.findMany({
      where: {
        keyResultId: { in: keyResultIds },
        deletedAt: null,
        ...where,
      },
      orderBy,
      ...(take ? { take } : {}),
    });

    const result = new Map<string, GoalRecord[]>();
    for (const krId of keyResultIds) {
      result.set(krId, []);
    }
    for (const item of data) {
      const record = this.mapToEntity(item);
      const list = result.get(item.keyResultId) ?? [];
      list.push(record);
      result.set(item.keyResultId, list);
    }
    return result;
  }

  /**
   * Count records for a key result
   */
  async countByKeyResultId(keyResultId: string): Promise<number> {
    return (this.prisma as any).goalRecord.count({
      where: { keyResultId, deletedAt: null },
    });
  }

  /**
   * Save a record (upsert)
   */
  async save(record: GoalRecord): Promise<void> {
    const dto = record.toPersistenceDTO();

    await (this.prisma as any).goalRecord.upsert({
      where: { id: dto.id as string },
      create: {
        id: dto.id as string,
        keyResultId: dto.keyResultId as string,
        value: dto.value,
        note: dto.note,
        recordedAt: dto.recordedAt,
        version: dto.version,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        deletedAt: dto.deletedAt,
      },
      update: {
        value: dto.value,
        note: dto.note,
        recordedAt: dto.recordedAt,
        version: dto.version,
        updatedAt: dto.updatedAt,
        deletedAt: dto.deletedAt,
      },
    });
  }

  /**
   * Delete a record by ID
   */
  async delete(recordId: string): Promise<void> {
    await (this.prisma as any).goalRecord.delete({
      where: { id: recordId },
    });
  }

  /**
   * Delete multiple records by IDs
   */
  async deleteMany(recordIds: string[]): Promise<void> {
    await (this.prisma as any).goalRecord.deleteMany({
      where: { id: { in: recordIds } },
    });
  }
}
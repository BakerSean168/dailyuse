/**
 * Prisma Weight Snapshot Repository
 *
 * Implements IWeightSnapshotRepository using Prisma.
 * Handles CRUD and query operations for KeyResultWeightSnapshot.
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IWeightSnapshotRepository, SnapshotQueryResult } from '@/domain-server';
import { KeyResultWeightSnapshot } from '@/domain-server';
import { PrismaWeightSnapshotMapper } from '../../mappers/prisma/prisma-weight-snapshot-mapper';

/**
 * Prisma Weight Snapshot Repository
 *
 * Supports pagination, time-range queries, and batch operations.
 */
export class PrismaWeightSnapshotRepository implements IWeightSnapshotRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Save a single snapshot
   */
  async save(snapshot: KeyResultWeightSnapshot): Promise<void> {
    const data = PrismaWeightSnapshotMapper.toPrisma(snapshot);
    await this.prisma.keyResultWeightSnapshot.create({ data });
  }

  /**
   * Batch save snapshots
   */
  async saveMany(snapshots: KeyResultWeightSnapshot[]): Promise<void> {
    const data = snapshots.map((s) => PrismaWeightSnapshotMapper.toPrisma(s));
    await this.prisma.keyResultWeightSnapshot.createMany({ data });
  }

  /**
   * Find all snapshots for a goal (paginated, newest first)
   */
  async findByGoal(
    goalId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SnapshotQueryResult> {
    const skip = (page - 1) * pageSize;

    const [snapshots, total] = await Promise.all([
      this.prisma.keyResultWeightSnapshot.findMany({
        where: { goalId },
        orderBy: { snapshotTime: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.keyResultWeightSnapshot.count({
        where: { goalId },
      }),
    ]);

    return {
      snapshots: PrismaWeightSnapshotMapper.toDomainList(snapshots),
      total,
    };
  }

  /**
   * Find all snapshots for a key result (paginated, newest first)
   */
  async findByKeyResult(
    keyResultId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SnapshotQueryResult> {
    const skip = (page - 1) * pageSize;

    const [snapshots, total] = await Promise.all([
      this.prisma.keyResultWeightSnapshot.findMany({
        where: { keyResultId },
        orderBy: { snapshotTime: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.keyResultWeightSnapshot.count({
        where: { keyResultId },
      }),
    ]);

    return {
      snapshots: PrismaWeightSnapshotMapper.toDomainList(snapshots),
      total,
    };
  }

  /**
   * Find snapshots within a time range (ascending order for trend analysis)
   */
  async findByTimeRange(
    startTime: number,
    endTime: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SnapshotQueryResult> {
    const skip = (page - 1) * pageSize;
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    const [snapshots, total] = await Promise.all([
      this.prisma.keyResultWeightSnapshot.findMany({
        where: {
          snapshotTime: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { snapshotTime: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.keyResultWeightSnapshot.count({
        where: {
          snapshotTime: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    return {
      snapshots: PrismaWeightSnapshotMapper.toDomainList(snapshots),
      total,
    };
  }

  /**
   * Find a single snapshot by ID
   */
  async findById(id: string): Promise<KeyResultWeightSnapshot | null> {
    const prismaSnapshot = await this.prisma.keyResultWeightSnapshot.findUnique({
      where: { id },
    });

    return prismaSnapshot ? PrismaWeightSnapshotMapper.toDomain(prismaSnapshot) : null;
  }

  /**
   * Delete a single snapshot
   */
  async delete(id: string): Promise<void> {
    await this.prisma.keyResultWeightSnapshot.delete({
      where: { id },
    });
  }

  /**
   * Delete all snapshots for a goal
   */
  async deleteByGoal(goalId: string): Promise<void> {
    await this.prisma.keyResultWeightSnapshot.deleteMany({
      where: { goalId },
    });
  }

  /**
   * Delete all snapshots for a key result
   */
  async deleteByKeyResult(keyResultId: string): Promise<void> {
    await this.prisma.keyResultWeightSnapshot.deleteMany({
      where: { keyResultId },
    });
  }
}
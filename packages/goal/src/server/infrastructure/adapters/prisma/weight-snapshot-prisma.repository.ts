/**
 * Prisma Weight Snapshot Repository
 *
 * Implements IWeightSnapshotRepository using Prisma.
 * Handles CRUD and query operations for KeyResultWeightSnapshot.
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IWeightSnapshotRepository, SnapshotQueryResult } from '../../../domain';
import { KeyResultWeightSnapshot } from '../../../domain';
import { PrismaWeightSnapshotMapper } from './mappers/prisma-weight-snapshot-mapper';

/**
 * Prisma Weight Snapshot Repository
 *
 * Supports pagination, time-range queries, and batch operations.
 */
export class PrismaWeightSnapshotRepository implements IWeightSnapshotRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(snapshot: KeyResultWeightSnapshot): Promise<void> {
    const data = PrismaWeightSnapshotMapper.toPrisma(snapshot);
    await this.prisma.keyResultWeightSnapshot.create({ data });
  }

  async saveMany(snapshots: KeyResultWeightSnapshot[]): Promise<void> {
    const data = snapshots.map((s) => PrismaWeightSnapshotMapper.toPrisma(s));
    await this.prisma.keyResultWeightSnapshot.createMany({ data });
  }

  async findByGoal(
    identityId: string,
    goalId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SnapshotQueryResult> {
    const skip = (page - 1) * pageSize;

    const [snapshots, total] = await Promise.all([
      this.prisma.keyResultWeightSnapshot.findMany({
        where: { identityId, goalId },
        orderBy: { snapshotTime: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.keyResultWeightSnapshot.count({
        where: { identityId, goalId },
      }),
    ]);

    return {
      snapshots: PrismaWeightSnapshotMapper.toDomainList(snapshots),
      total,
    };
  }

  async findByKeyResult(
    identityId: string,
    keyResultId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SnapshotQueryResult> {
    const skip = (page - 1) * pageSize;

    const [snapshots, total] = await Promise.all([
      this.prisma.keyResultWeightSnapshot.findMany({
        where: { identityId, keyResultId },
        orderBy: { snapshotTime: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.keyResultWeightSnapshot.count({
        where: { identityId, keyResultId },
      }),
    ]);

    return {
      snapshots: PrismaWeightSnapshotMapper.toDomainList(snapshots),
      total,
    };
  }

  async findByTimeRange(
    identityId: string,
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
          identityId,
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
          identityId,
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

  async findById(id: string): Promise<KeyResultWeightSnapshot | null> {
    const prismaSnapshot = await this.prisma.keyResultWeightSnapshot.findUnique({
      where: { id },
    });

    return prismaSnapshot ? PrismaWeightSnapshotMapper.toDomain(prismaSnapshot) : null;
  }

  async findByIdForIdentity(
    identityId: string,
    id: string,
  ): Promise<KeyResultWeightSnapshot | null> {
    const prismaSnapshot = await this.prisma.keyResultWeightSnapshot.findFirst({
      where: { id, identityId },
    });

    return prismaSnapshot ? PrismaWeightSnapshotMapper.toDomain(prismaSnapshot) : null;
  }

  async delete(identityId: string, id: string): Promise<void> {
    const result = await this.prisma.keyResultWeightSnapshot.deleteMany({
      where: { id, identityId },
    });
    if (result.count === 0) {
      throw new Error('Weight snapshot not found for the current identity.');
    }
  }

  async deleteByGoal(identityId: string, goalId: string): Promise<void> {
    await this.prisma.keyResultWeightSnapshot.deleteMany({
      where: { identityId, goalId },
    });
  }

  async deleteByKeyResult(identityId: string, keyResultId: string): Promise<void> {
    await this.prisma.keyResultWeightSnapshot.deleteMany({
      where: { identityId, keyResultId },
    });
  }
}

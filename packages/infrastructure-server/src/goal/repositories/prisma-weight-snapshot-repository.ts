/**
 * Prisma Weight Snapshot Repository Implementation
 * 权重快照仓储 Prisma 实现
 *
 * 负责权重快照的持久化操作。
 */

import type { PrismaClient } from '@prisma/client';
import type { IWeightSnapshotRepository, SnapshotQueryResult } from '@dailyuse/domain-server/goal';
import { KeyResultWeightSnapshot } from '@dailyuse/domain-server/goal';
import { PrismaWeightSnapshotMapper } from '../mappers/PrismaWeightSnapshotMapper';

/**
 * Prisma Weight Snapshot Repository
 *
 * **设计模式**: Repository Pattern
 * **职责**:
 * - 实现 IWeightSnapshotRepository 接口
 * - 处理所有数据库操作 (CRUD + 查询)
 * - 使用 Mapper 进行 Domain ↔ Prisma 转换
 *
 * **查询特性**:
 * - 分页支持 (page, pageSize)
 * - 时间倒序排序 (最新的在前)
 * - 多维度查询 (Goal, KeyResult, TimeRange)
 */
export class PrismaWeightSnapshotRepository implements IWeightSnapshotRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 保存单个快照
   *
   * **事务**: 使用 Prisma 自动事务
   * **冲突**: UUID 冲突时会抛出 Prisma 错误
   *
   * @param snapshot - Domain快照对象
   * @throws {PrismaClientKnownRequestError} 当 UUID 冲突时
   *
   * @example
   * ```typescript
   * const snapshot = new KeyResultWeightSnapshot(...);
   * await repository.save(snapshot);
   * ```
   */
  async save(snapshot: KeyResultWeightSnapshot): Promise<void> {
    const data = PrismaWeightSnapshotMapper.toPrisma(snapshot);
    await this.prisma.keyResultWeightSnapshot.create({ data });
  }

  /**
   * 批量保存快照
   *
   * **性能优化**: 使用 Prisma createMany 批量插入
   * **事务**: 整个批量操作在单个事务中执行
   *
   * @param snapshots - Domain快照对象数组
   *
   * @example
   * ```typescript
   * const snapshots = [...]; // KeyResultWeightSnapshot[]
   * await repository.saveMany(snapshots);
   * ```
   */
  async saveMany(snapshots: KeyResultWeightSnapshot[]): Promise<void> {
    const data = snapshots.map((s) => PrismaWeightSnapshotMapper.toPrisma(s));
    await this.prisma.keyResultWeightSnapshot.createMany({ data });
  }

  /**
   * 查询 Goal 的所有快照
   *
   * **排序**: 按 snapshotTime 倒序 (最新的在前)
   * **分页**: 支持 page 和 pageSize 参数
   *
   * @param goalUuid - Goal UUID
   * @param page - 页码 (从 1 开始)
   * @param pageSize - 每页数量
   * @returns 快照列表和总数
   *
   * @example
   * ```typescript
   * const { snapshots, total } = await repository.findByGoal('goal-123', 1, 20);
   * console.log(`Found ${total} snapshots, showing page 1`);
   * ```
   */
  async findByGoal(
    goalUuid: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SnapshotQueryResult> {
    const skip = (page - 1) * pageSize;

    const [snapshots, total] = await Promise.all([
      this.prisma.keyResultWeightSnapshot.findMany({
        where: { goalUuid },
        orderBy: { snapshotTime: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.keyResultWeightSnapshot.count({
        where: { goalUuid },
      }),
    ]);

    return {
      snapshots: PrismaWeightSnapshotMapper.toDomainList(snapshots),
      total,
    };
  }

  /**
   * 查询 KeyResult 的所有快照
   *
   * **排序**: 按 snapshotTime 倒序 (最新的在前)
   * **分页**: 支持 page 和 pageSize 参数
   *
   * @param krUuid - KeyResult UUID
   * @param page - 页码 (从 1 开始)
   * @param pageSize - 每页数量
   * @returns 快照列表和总数
   *
   * @example
   * ```typescript
   * const { snapshots, total } = await repository.findByKeyResult('kr-456', 1, 10);
   * ```
   */
  async findByKeyResult(
    krUuid: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SnapshotQueryResult> {
    const skip = (page - 1) * pageSize;

    const [snapshots, total] = await Promise.all([
      this.prisma.keyResultWeightSnapshot.findMany({
        where: { keyResultUuid: krUuid },
        orderBy: { snapshotTime: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.keyResultWeightSnapshot.count({
        where: { keyResultUuid: krUuid },
      }),
    ]);

    return {
      snapshots: PrismaWeightSnapshotMapper.toDomainList(snapshots),
      total,
    };
  }

  /**
   * 查询时间范围内的快照
   *
   * **排序**: 按 snapshotTime 升序 (时间线顺序，用于趋势分析)
   * **边界**: 包含起止时间 (gte, lte)
   * **分页**: 支持 page 和 pageSize 参数
   *
   * @param startTime - 开始时间戳 (ms)
   * @param endTime - 结束时间戳 (ms)
   * @param page - 页码 (从 1 开始)
   * @param pageSize - 每页数量
   * @returns 快照列表和总数
   *
   * @example
   * ```typescript
   * const start = Date.parse('2025-01-01');
   * const end = Date.parse('2025-12-31');
   * const { snapshots, total } = await repository.findByTimeRange(start, end, 1, 50);
   * ```
   */
  async findByTimeRange(
    startTime: number,
    endTime: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SnapshotQueryResult> {
    const skip = (page - 1) * pageSize;

    const [snapshots, total] = await Promise.all([
      this.prisma.keyResultWeightSnapshot.findMany({
        where: {
          snapshotTime: {
            gte: BigInt(startTime), // number → BigInt 转换
            lte: BigInt(endTime),
          },
        },
        orderBy: { snapshotTime: 'asc' }, // 时间线顺序 (用于趋势图)
        skip,
        take: pageSize,
      }),
      this.prisma.keyResultWeightSnapshot.count({
        where: {
          snapshotTime: {
            gte: BigInt(startTime),
            lte: BigInt(endTime),
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
   * 根据 UUID 查询单个快照
   *
   * @param uuid - 快照 UUID
   * @returns 快照对象或 null
   *
   * @example
   * ```typescript
   * const snapshot = await repository.findById('snapshot-123');
   * if (snapshot) {
   *   console.log(`Found: ${snapshot.uuid}`);
   * }
   * ```
   */
  async findById(uuid: string): Promise<KeyResultWeightSnapshot | null> {
    const prismaSnapshot = await this.prisma.keyResultWeightSnapshot.findUnique({
      where: { uuid },
    });

    return prismaSnapshot ? PrismaWeightSnapshotMapper.toDomain(prismaSnapshot) : null;
  }

  /**
   * 删除单个快照
   *
   * @param uuid - 快照 UUID
   *
   * @example
   * ```typescript
   * await repository.delete('snapshot-123');
   * ```
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.keyResultWeightSnapshot.delete({
      where: { uuid },
    });
  }

  /**
   * 删除 Goal 的所有快照
   *
   * **批量操作**: 使用 deleteMany 批量删除
   * **级联**: Goal 删除时会自动级联删除 (onDelete: Cascade)
   *
   * @param goalUuid - Goal UUID
   *
   * @example
   * ```typescript
   * await repository.deleteByGoal('goal-123');
   * ```
   */
  async deleteByGoal(goalUuid: string): Promise<void> {
    await this.prisma.keyResultWeightSnapshot.deleteMany({
      where: { goalUuid },
    });
  }

  /**
   * 删除 KeyResult 的所有快照
   *
   * **批量操作**: 使用 deleteMany 批量删除
   * **级联**: KR 删除时会自动级联删除 (onDelete: Cascade)
   *
   * @param krUuid - KeyResult UUID
   *
   * @example
   * ```typescript
   * await repository.deleteByKeyResult('kr-456');
   * ```
   */
  async deleteByKeyResult(krUuid: string): Promise<void> {
    await this.prisma.keyResultWeightSnapshot.deleteMany({
      where: { keyResultUuid: krUuid },
    });
  }

  /**
   * 删除时间范围内的快照
   *
   * **用途**: 清理历史数据、数据归档
   * **批量操作**: 使用 deleteMany 批量删除
   *
   * @param startTime - 开始时间戳 (ms)
   * @param endTime - 结束时间戳 (ms)
   * @returns 删除的记录数量
   *
   * @example
   * ```typescript
   * const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
   * const count = await repository.deleteByTimeRange(0, oneYearAgo);
   * console.log(`Archived ${count} old snapshots`);
   * ```
   */
  async deleteByTimeRange(startTime: number, endTime: number): Promise<number> {
    const result = await this.prisma.keyResultWeightSnapshot.deleteMany({
      where: {
        snapshotTime: {
          gte: BigInt(startTime),
          lte: BigInt(endTime),
        },
      },
    });
    return result.count;
  }
}

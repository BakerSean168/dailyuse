/**
 * Prisma Weight Snapshot Mapper
 * 权重快照 Prisma 映射器
 *
 * 负责在 Domain 对象和 Prisma 模型之间进行转换。
 */

import { KeyResultWeightSnapshot } from '@dailyuse/domain-server/goal';
import type { Prisma } from '@prisma/client';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, SnapshotTrigger } from '@dailyuse/contracts/goal';


/**
 * Prisma Weight Snapshot 类型 (生成后可用)
 * 注意: 需要在 prisma generate 后才能使用具体类型
 */
type PrismaWeightSnapshot = {
  uuid: string;
  goalUuid: string;
  keyResultUuid: string;
  oldWeight: number;
  newWeight: number;
  weightDelta: number;
  snapshotTime: bigint;
  trigger: string;
  reason: string | null;
  operatorUuid: string;
  createdAt: Date;
};

/**
 * Weight Snapshot Mapper
 *
 * **职责**:
 * - Domain对象 → Prisma模型 (toPrisma)
 * - Prisma模型 → Domain对象 (toDomain)
 * - 处理类型转换 (BigInt, Date, etc.)
 */
export class PrismaWeightSnapshotMapper {
  /**
   * Domain 转 Prisma Create Input
   *
   * **转换规则**:
   * - snapshotTime: number → BigInt
   * - createdAt: number | undefined → Date
   * - reason: string | undefined → string | null
   *
   * @param snapshot - Domain层的快照对象
   * @returns Prisma create input数据
   *
   * @example
   * ```typescript
   * const snapshot = new KeyResultWeightSnapshot(...);
   * const prismaData = PrismaWeightSnapshotMapper.toPrisma(snapshot);
   * await prisma.keyResultWeightSnapshot.create({ data: prismaData });
   * ```
   */
  static toPrisma(snapshot: KeyResultWeightSnapshot) {
    return {
      uuid: snapshot.uuid,
      goalUuid: snapshot.goalUuid,
      keyResultUuid: snapshot.keyResultUuid,
      oldWeight: snapshot.oldWeight,
      newWeight: snapshot.newWeight,
      weightDelta: snapshot.weightDelta,
      snapshotTime: BigInt(snapshot.snapshotTime), // number → BigInt
      trigger: snapshot.trigger,
      reason: snapshot.reason ?? null, // undefined → null
      operatorUuid: snapshot.operatorUuid,
      createdAt: new Date(snapshot.createdAt ?? Date.now()), // number → Date
    };
  }

  /**
   * Prisma Model 转 Domain Object
   *
   * **转换规则**:
   * - snapshotTime: BigInt → number
   * - createdAt: Date → number (timestamp)
   * - reason: string | null → string | undefined
   *
   * @param prismaSnapshot - Prisma查询结果
   * @returns Domain层的快照对象
   *
   * @example
   * ```typescript
   * const prismaSnapshot = await prisma.keyResultWeightSnapshot.findUnique(...);
   * const domainSnapshot = PrismaWeightSnapshotMapper.toDomain(prismaSnapshot);
   * ```
   */
  static toDomain(prismaSnapshot: PrismaWeightSnapshot): KeyResultWeightSnapshot {
    return new KeyResultWeightSnapshot(
      prismaSnapshot.uuid,
      prismaSnapshot.goalUuid,
      prismaSnapshot.keyResultUuid,
      prismaSnapshot.oldWeight,
      prismaSnapshot.newWeight,
      Number(prismaSnapshot.snapshotTime), // BigInt → number
      prismaSnapshot.trigger as SnapshotTrigger, // string → SnapshotTrigger
      prismaSnapshot.operatorUuid,
      prismaSnapshot.reason ?? undefined, // null → undefined
      prismaSnapshot.createdAt.getTime(), // Date → number (timestamp)
    );
  }

  /**
   * 批量转换: Prisma → Domain
   *
   * @param prismaSnapshots - Prisma查询结果数组
   * @returns Domain对象数组
   *
   * @example
   * ```typescript
   * const snapshots = await prisma.keyResultWeightSnapshot.findMany(...);
   * const domainSnapshots = PrismaWeightSnapshotMapper.toDomainList(snapshots);
   * ```
   */
  static toDomainList(prismaSnapshots: PrismaWeightSnapshot[]): KeyResultWeightSnapshot[] {
    return prismaSnapshots.map((snapshot) => this.toDomain(snapshot));
  }
}


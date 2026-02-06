/**
 * Prisma Weight Snapshot Mapper
 * 鏉冮噸蹇収 Prisma 鏄犲皠鍣?
 *
 * 璐熻矗鍦?Domain 瀵硅薄鍜?Prisma 妯″瀷涔嬮棿杩涜杞崲銆?
 */

import { KeyResultWeightSnapshot } from '@dailyuse/domain-server/goal';
import type { Prisma } from '../../generated/prisma/client';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO, SnapshotTrigger } from '@dailyuse/contracts/goal';


/**
 * Prisma Weight Snapshot 绫诲瀷 (鐢熸垚鍚庡彲鐢?
 * 娉ㄦ剰: Need瑕佸湪 prisma generate 鍚庢墠鑳戒娇鐢ㄥ叿浣撶被鍨?
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
 * **鑱岃矗**:
 * - Domain瀵硅薄 鈫?Prisma妯″瀷 (toPrisma)
 * - Prisma妯″瀷 鈫?Domain瀵硅薄 (toDomain)
 * - 澶勭悊绫诲瀷杞崲 (BigInt, Date, etc.)
 */
export class PrismaWeightSnapshotMapper {
  /**
   * Domain 杞?Prisma Create Input
   *
   * **杞崲瑙勫垯**:
   * - snapshotTime: number 鈫?BigInt
   * - createdAt: number | undefined 鈫?Date
   * - reason: string | undefined 鈫?string | null
   *
   * @param snapshot - Domain灞傜殑蹇収瀵硅薄
   * @returns Prisma create input鏁版嵁
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
      snapshotTime: BigInt(snapshot.snapshotTime), // number 鈫?BigInt
      trigger: snapshot.trigger,
      reason: snapshot.reason ?? null, // undefined 鈫?null
      operatorUuid: snapshot.operatorUuid,
      createdAt: new Date(snapshot.createdAt ?? Date.now()), // number 鈫?Date
    };
  }

  /**
   * Prisma Model 杞?Domain Object
   *
   * **杞崲瑙勫垯**:
   * - snapshotTime: BigInt 鈫?number
   * - createdAt: Date 鈫?number (timestamp)
   * - reason: string | null 鈫?string | undefined
   *
   * @param prismaSnapshot - Prisma鏌ヨ缁撴灉
   * @returns Domain灞傜殑蹇収瀵硅薄
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
      Number(prismaSnapshot.snapshotTime), // BigInt 鈫?number
      prismaSnapshot.trigger as SnapshotTrigger, // string 鈫?SnapshotTrigger
      prismaSnapshot.operatorUuid,
      prismaSnapshot.reason ?? undefined, // null 鈫?undefined
      prismaSnapshot.createdAt.getTime(), // Date 鈫?number (timestamp)
    );
  }

  /**
   * 鎵归噺杞崲: Prisma 鈫?Domain
   *
   * @param prismaSnapshots - Prisma鏌ヨ缁撴灉鏁扮粍
   * @returns Domain瀵硅薄鏁扮粍
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


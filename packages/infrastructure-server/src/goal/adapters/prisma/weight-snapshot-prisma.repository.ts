/**
 * Prisma Weight Snapshot Repository Implementation
 * 鏉冮噸蹇収浠撳偍 Prisma 瀹炵幇
 *
 * 璐熻矗鏉冮噸蹇収鐨勬寔涔呭寲鎿嶄綔銆?
 */

import type { PrismaClient } from '@prisma/client';
import type { IWeightSnapshotRepository, SnapshotQueryResult } from '@dailyuse/domain-server/goal';
import { KeyResultWeightSnapshot } from '@dailyuse/domain-server/goal';
import { PrismaWeightSnapshotMapper } from '../../mappers/prisma-weight-snapshot-mapper';

/**
 * Prisma Weight Snapshot Repository
 *
 * **璁捐妯″紡**: Repository Pattern
 * **鑱岃矗**:
 * - 瀹炵幇 IWeightSnapshotRepository 鎺ュ彛
 * - 澶勭悊鎵€鏈夋暟鎹簱鎿嶄綔 (CRUD + 鏌ヨ)
 * - 浣跨敤 Mapper 杩涜 Domain 鈫?Prisma 杞崲
 *
 * **鏌ヨ鐗规€?*:
 * - 鍒嗛〉鏀寔 (page, pageSize)
 * - 鏃堕棿鍊掑簭鎺掑簭 (鏈€鏂扮殑鍦ㄥ墠)
 * - 澶氱淮搴︽煡璇?(Goal, KeyResult, TimeRange)
 */
export class PrismaWeightSnapshotRepository implements IWeightSnapshotRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 淇濆瓨鍗曚釜蹇収
   *
   * **浜嬪姟**: 浣跨敤 Prisma 鑷姩浜嬪姟
   * **鍐茬獊**: UUID 鍐茬獊鏃朵細鎶涘嚭 Prisma 閿欒
   *
   * @param snapshot - Domain蹇収瀵硅薄
   * @throws {PrismaClientKnownRequestError} 褰?UUID 鍐茬獊鏃?
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
   * 鎵归噺淇濆瓨蹇収
   *
   * **鎬ц兘浼樺寲**: 浣跨敤 Prisma createMany 鎵归噺鎻掑叆
   * **浜嬪姟**: 鏁翠釜鎵归噺鎿嶄綔鍦ㄥ崟涓簨鍔′腑鎵ц
   *
   * @param snapshots - Domain蹇収瀵硅薄鏁扮粍
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
   * 鏌ヨ Goal 鐨勬墍鏈夊揩鐓?
   *
   * **鎺掑簭**: 鎸?snapshotTime 鍊掑簭 (鏈€鏂扮殑鍦ㄥ墠)
   * **鍒嗛〉**: 鏀寔 page 鍜?pageSize 鍙傛暟
   *
   * @param goalUuid - Goal UUID
   * @param page - 椤电爜 (浠?1 寮€濮?
   * @param pageSize - 姣忛〉鏁伴噺
   * @returns 蹇収鍒楄〃鍜屾€绘暟
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
   * 鏌ヨ KeyResult 鐨勬墍鏈夊揩鐓?
   *
   * **鎺掑簭**: 鎸?snapshotTime 鍊掑簭 (鏈€鏂扮殑鍦ㄥ墠)
   * **鍒嗛〉**: 鏀寔 page 鍜?pageSize 鍙傛暟
   *
   * @param krUuid - KeyResult UUID
   * @param page - 椤电爜 (浠?1 寮€濮?
   * @param pageSize - 姣忛〉鏁伴噺
   * @returns 蹇収鍒楄〃鍜屾€绘暟
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
   * 鏌ヨ鏃堕棿鑼冨洿鍐呯殑蹇収
   *
   * **鎺掑簭**: 鎸?snapshotTime 鍗囧簭 (鏃堕棿绾块『搴忥紝鐢ㄤ簬瓒嬪娍鍒嗘瀽)
   * **杈圭晫**: 鍖呭惈璧锋鏃堕棿 (gte, lte)
   * **鍒嗛〉**: 鏀寔 page 鍜?pageSize 鍙傛暟
   *
   * @param startTime - 寮€濮嬫椂闂存埑 (ms)
   * @param endTime - 缁撴潫鏃堕棿鎴?(ms)
   * @param page - 椤电爜 (浠?1 寮€濮?
   * @param pageSize - 姣忛〉鏁伴噺
   * @returns 蹇収鍒楄〃鍜屾€绘暟
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
            gte: BigInt(startTime), // number 鈫?BigInt 杞崲
            lte: BigInt(endTime),
          },
        },
        orderBy: { snapshotTime: 'asc' }, // 鏃堕棿绾块『搴?(鐢ㄤ簬瓒嬪娍鍥?
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
   * 鏍规嵁 UUID 鏌ヨ鍗曚釜蹇収
   *
   * @param uuid - 蹇収 UUID
   * @returns 蹇収瀵硅薄鎴?null
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
   * 鍒犻櫎鍗曚釜蹇収
   *
   * @param uuid - 蹇収 UUID
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
   * 鍒犻櫎 Goal 鐨勬墍鏈夊揩鐓?
   *
   * **鎵归噺鎿嶄綔**: 浣跨敤 deleteMany 鎵归噺鍒犻櫎
   * **绾ц仈**: Goal 鍒犻櫎鏃朵細鑷姩绾ц仈鍒犻櫎 (onDelete: Cascade)
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
   * 鍒犻櫎 KeyResult 鐨勬墍鏈夊揩鐓?
   *
   * **鎵归噺鎿嶄綔**: 浣跨敤 deleteMany 鎵归噺鍒犻櫎
   * **绾ц仈**: KR 鍒犻櫎鏃朵細鑷姩绾ц仈鍒犻櫎 (onDelete: Cascade)
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
   * 鍒犻櫎鏃堕棿鑼冨洿鍐呯殑蹇収
   *
   * **鐢ㄩ€?*: 娓呯悊鍘嗗彶鏁版嵁銆佹暟鎹綊妗?
   * **鎵归噺鎿嶄綔**: 浣跨敤 deleteMany 鎵归噺鍒犻櫎
   *
   * @param startTime - 寮€濮嬫椂闂存埑 (ms)
   * @param endTime - 缁撴潫鏃堕棿鎴?(ms)
   * @returns 鍒犻櫎鐨勮褰曟暟閲?
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

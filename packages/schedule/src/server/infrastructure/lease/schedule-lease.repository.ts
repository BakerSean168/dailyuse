import type { PrismaClient } from '@memoflow/database';

export interface ScheduleLeaseRequest {
  leaseKey: string;
  ownerToken: string;
  now: number;
  expiresAt: number;
}

/**
 * R3a：调度器宿主租约仓储端口（Prisma 原子实现）。
 * 语义与 KnowledgeRepositoryLease 一致：tryAcquire 原子抢占，
 * renew 仅 owner 可续约，release 仅 owner 可释放。
 */
export interface IScheduleLeaseRepository {
  tryAcquire(request: ScheduleLeaseRequest): Promise<boolean>;
  renew(request: ScheduleLeaseRequest): Promise<boolean>;
  release(leaseKey: string, ownerToken: string): Promise<void>;
}

export function createScheduleLeasePrismaRepository(db: PrismaClient): IScheduleLeaseRepository {
  return {
    async tryAcquire(request): Promise<boolean> {
      const now = new Date(request.now);
      await db.$transaction(async (tx) => {
        // 1) 清掉已过期的旧租约（原子抢占前提）。
        await tx.scheduleLease.deleteMany({
          where: { leaseKey: request.leaseKey, expiresAt: { lte: now } },
        });
        // 2) 抢占：键不存在才创建（并发下只有一个成功）。
        await tx.scheduleLease.create({
          data: {
            id: `${request.leaseKey}:${request.ownerToken}`,
            leaseKey: request.leaseKey,
            ownerToken: request.ownerToken,
            expiresAt: new Date(request.expiresAt),
          },
        });
      });
      return true;
    },

    async renew(request): Promise<boolean> {
      const result = await db.scheduleLease.updateMany({
        where: {
          leaseKey: request.leaseKey,
          ownerToken: request.ownerToken,
          expiresAt: { gt: new Date(request.now) },
        },
        data: { expiresAt: new Date(request.expiresAt) },
      });
      return result.count > 0;
    },

    async release(leaseKey, ownerToken): Promise<void> {
      await db.scheduleLease.deleteMany({
        where: { leaseKey, ownerToken },
      });
    },
  };
}

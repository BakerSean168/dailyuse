import { randomUUID } from 'node:crypto';
import type { IScheduleLeaseRepository, ScheduleLeaseRequest } from './schedule-lease.repository';

export const SCHEDULE_LEASE_TTL_MS = 60_000;
export const SCHEDULE_LEASE_RENEWAL_INTERVAL_MS = 20_000;
export const SCHEDULE_LEASE_KEY = 'schedule-host';

export class ScheduleLeaseLostError extends Error {
  constructor() {
    super('Schedule host lease ownership was lost');
    this.name = 'ScheduleLeaseLostError';
  }
}

export interface ScheduleLeaseGuard {
  ensureHeld(): Promise<void>;
}

export interface ScheduleLeaseCoordinatorOptions {
  now?: () => number;
  ttlMs?: number;
  renewalIntervalMs?: number;
}

/**
 * R3a：调度器宿主租约协调器（仿 KnowledgeRepositoryLeaseCoordinator）。
 *
 * - acquire：原子抢占 `schedule_leases`（leaseKey 唯一，过期租约先清理）；
 * - 心跳：renewalIntervalMs 定期续约（仅 owner 可续）；
 * - 释放：任务结束（成功/失败/宿主停止）时仅 owner 释放；
 * - 无 repository（单宿主/测试）时直接放行，行为与旧版一致。
 */
export class ScheduleLeaseCoordinator {
  private readonly now: () => number;
  private readonly ttlMs: number;
  private readonly renewalIntervalMs: number;

  constructor(
    private readonly repository: IScheduleLeaseRepository | null | undefined,
    options: ScheduleLeaseCoordinatorOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.ttlMs = Math.max(1_000, options.ttlMs ?? SCHEDULE_LEASE_TTL_MS);
    this.renewalIntervalMs = Math.max(
      250,
      Math.min(
        options.renewalIntervalMs ?? SCHEDULE_LEASE_RENEWAL_INTERVAL_MS,
        Math.floor(this.ttlMs / 2),
      ),
    );
  }

  async execute<T>(
    leaseKey: string,
    task: (guard: ScheduleLeaseGuard) => Promise<T>,
  ): Promise<{ acquired: boolean; value?: T }> {
    if (!this.repository) {
      return { acquired: true, value: await task({ ensureHeld: async () => undefined }) };
    }

    const ownerToken = randomUUID();
    const request = (): ScheduleLeaseRequest => {
      const now = this.now();
      return { leaseKey, ownerToken, now, expiresAt: now + this.ttlMs };
    };

    let acquired = false;
    try {
      acquired = await this.repository.tryAcquire(request());
    } catch (error) {
      // 抢占失败（并发创建冲突/瞬时错误）：视为未获取，不启动调度。
      console.error('[ScheduleLease] tryAcquire failed', { leaseKey, error });
      return { acquired: false };
    }
    if (!acquired) return { acquired: false };

    let held = true;
    let renewal: Promise<void> | null = null;
    const renew = async (): Promise<void> => {
      if (!held) return;
      renewal ??= this.repository!.renew(request())
        .then((renewed) => {
          held = renewed;
        })
        .catch(() => {
          held = false;
        })
        .finally(() => {
          renewal = null;
        });
      await renewal;
    };
    const timer = setInterval(() => void renew(), this.renewalIntervalMs);
    timer.unref?.();
    const guard: ScheduleLeaseGuard = {
      ensureHeld: async () => {
        await renew();
        if (!held) throw new ScheduleLeaseLostError();
      },
    };
    try {
      return { acquired: true, value: await task(guard) };
    } finally {
      clearInterval(timer);
      await renewal;
      held = false;
      await this.repository.release(leaseKey, ownerToken).catch(() => undefined);
    }
  }
}

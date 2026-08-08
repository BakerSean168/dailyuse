import { describe, expect, it, vi } from 'vitest';
import {
  ScheduleLeaseCoordinator,
  SCHEDULE_LEASE_KEY,
  SCHEDULE_LEASE_TTL_MS,
} from './schedule-lease-coordinator';
import type { IScheduleLeaseRepository } from './schedule-lease.repository';

function mockRepository(overrides: Partial<IScheduleLeaseRepository> = {}): IScheduleLeaseRepository {
  return {
    tryAcquire: vi.fn(async () => true),
    renew: vi.fn(async () => true),
    release: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('ScheduleLeaseCoordinator (R3a)', () => {
  it('runs the task when no repository is provided (single-host / tests)', async () => {
    const coordinator = new ScheduleLeaseCoordinator(null);
    const task = vi.fn(async () => 'ok');

    const result = await coordinator.execute(SCHEDULE_LEASE_KEY, task);

    expect(result.acquired).toBe(true);
    expect(result.value).toBe('ok');
  });

  it('does not run the task when acquire fails', async () => {
    const coordinator = new ScheduleLeaseCoordinator(mockRepository({ tryAcquire: vi.fn(async () => false) }));
    const task = vi.fn(async () => 'ok');

    const result = await coordinator.execute(SCHEDULE_LEASE_KEY, task);

    expect(result.acquired).toBe(false);
    expect(result.value).toBeUndefined();
    expect(task).not.toHaveBeenCalled();
  });

  it('holds the lease until the task completes, then releases (only owner)', async () => {
    const repository = mockRepository();
    const coordinator = new ScheduleLeaseCoordinator(repository);

    await coordinator.execute(SCHEDULE_LEASE_KEY, async () => 'done');

    expect(repository.tryAcquire).toHaveBeenCalledTimes(1);
    const request = vi.mocked(repository.tryAcquire).mock.calls[0][0];
    expect(request.expiresAt - request.now).toBe(SCHEDULE_LEASE_TTL_MS);
    expect(repository.release).toHaveBeenCalledWith(SCHEDULE_LEASE_KEY, request.ownerToken);
  });

  it('renews the lease periodically while the task is running', async () => {
    vi.useFakeTimers();
    try {
      const repository = mockRepository();
      const coordinator = new ScheduleLeaseCoordinator(repository, {
        ttlMs: 6_000,
        renewalIntervalMs: 1_000,
        now: () => 0,
      });

      let resolveTask: (() => void) | undefined;
      const promise = coordinator.execute(SCHEDULE_LEASE_KEY, () =>
        new Promise<void>((resolve) => {
          resolveTask = resolve;
        }),
      );

      await vi.advanceTimersByTimeAsync(2_500);
      resolveTask?.();
      await promise;

      expect(vi.mocked(repository.renew).mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(vi.mocked(repository.renew).mock.calls[0][0].leaseKey).toBe(SCHEDULE_LEASE_KEY);
    } finally {
      vi.useRealTimers();
    }
  });

  it('surfaces acquire errors as not-acquired instead of crashing the host', async () => {
    const coordinator = new ScheduleLeaseCoordinator(
      mockRepository({ tryAcquire: vi.fn(async () => {
        throw new Error('db down');
      }) }),
    );
    const task = vi.fn(async () => 'ok');

    const result = await coordinator.execute(SCHEDULE_LEASE_KEY, task);

    expect(result.acquired).toBe(false);
    expect(task).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  getStatus: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  rebuildAllProfileSnapshots: vi.fn(),
  env: {
    POWERSYNC_SNAPSHOT_DIR: '/tmp/powersync-snapshots',
    SNAPSHOT_REBUILD_ENABLED: true,
    SNAPSHOT_REBUILD_SCHEDULE: '0 */4 * * *',
    TZ: 'Asia/Shanghai',
  },
}));

vi.mock('./cron-scheduler-manager', () => {
  class MockCronSchedulerManager {
    register = mocks.register;
    getStatus = mocks.getStatus;
    start = mocks.start;
    stop = mocks.stop;
  }
  return { CronSchedulerManager: MockCronSchedulerManager };
});

vi.mock('../config/env', () => ({
  env: mocks.env,
}));

vi.mock('./jobs/snapshot-rebuild.job.js', () => ({
  rebuildAllProfileSnapshots: mocks.rebuildAllProfileSnapshots,
}));

describe('createCronScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStatus.mockReturnValue([]);
    mocks.env.POWERSYNC_SNAPSHOT_DIR = '/tmp/powersync-snapshots';
    mocks.env.SNAPSHOT_REBUILD_ENABLED = true;
    mocks.env.SNAPSHOT_REBUILD_SCHEDULE = '0 */4 * * *';
    mocks.env.TZ = 'Asia/Shanghai';
    mocks.rebuildAllProfileSnapshots.mockResolvedValue(undefined);
  });

  it('registers the snapshot rebuild job when a snapshot root is configured', async () => {
    const { createCronScheduler } = await import('./register-cron-jobs.js');

    const scheduler = createCronScheduler();

    expect(mocks.register).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'powersync:snapshot-rebuild',
        schedule: '0 */4 * * *',
        enabled: true,
        timezone: 'Asia/Shanghai',
        task: expect.any(Function),
      }),
    );

    const jobConfig = mocks.register.mock.calls[0]![0] as {
      task: () => Promise<void>;
    };
    await jobConfig.task();
    expect(mocks.rebuildAllProfileSnapshots).toHaveBeenCalledWith('/tmp/powersync-snapshots');
    expect(scheduler).toBeDefined();
  });

  it('does not register the snapshot rebuild job when no snapshot root is configured', async () => {
    mocks.env.POWERSYNC_SNAPSHOT_DIR = undefined as unknown as string;

    const { createCronScheduler } = await import('./register-cron-jobs.js');
    createCronScheduler();

    expect(mocks.register).not.toHaveBeenCalled();
  });

  it('registers hourly expired device-code cleanup when cloud auth provides it', async () => {
    const cleanupExpiredDeviceCodes = vi.fn().mockResolvedValue(3);
    const { createCronScheduler } = await import('./register-cron-jobs.js');

    createCronScheduler({ cleanupExpiredDeviceCodes });

    const cleanupJob = mocks.register.mock.calls
      .map(([job]) => job as { name: string; schedule: string; task: () => Promise<void> })
      .find((job) => job.name === 'cloud-auth:expired-device-code-cleanup');
    expect(cleanupJob).toMatchObject({ schedule: '0 * * * *' });
    await cleanupJob?.task();
    expect(cleanupExpiredDeviceCodes).toHaveBeenCalledOnce();
  });
});

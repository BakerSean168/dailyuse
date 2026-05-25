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

vi.mock('./cron-scheduler-manager', () => ({
  CronSchedulerManager: {
    getInstance: vi.fn(() => ({
      register: mocks.register,
      getStatus: mocks.getStatus,
      start: mocks.start,
      stop: mocks.stop,
    })),
  },
}));

vi.mock('@/shared/infrastructure/config/env.js', () => ({
  env: mocks.env,
}));

vi.mock('./jobs/snapshot-rebuild.job.js', () => ({
  rebuildAllProfileSnapshots: mocks.rebuildAllProfileSnapshots,
}));

describe('registerAllCronJobs', () => {
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
    const { registerAllCronJobs } = await import('./register-cron-jobs.js');

    registerAllCronJobs();

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
  });

  it('does not register the snapshot rebuild job when no snapshot root is configured', async () => {
    mocks.env.POWERSYNC_SNAPSHOT_DIR = undefined as unknown as string;

    const { registerAllCronJobs } = await import('./register-cron-jobs.js');
    registerAllCronJobs();

    expect(mocks.register).not.toHaveBeenCalled();
  });
});

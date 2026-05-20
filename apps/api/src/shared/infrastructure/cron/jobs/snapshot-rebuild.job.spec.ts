import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  buildProfileSnapshot: vi.fn(),
  getPowerSyncConfig: vi.fn(),
}));

vi.mock('@dailyuse/database', () => ({
  prisma: {
    account: {
      findMany: mocks.findMany,
    },
  },
}));

vi.mock('../../../../modules/powersync/snapshot-builder.js', () => ({
  buildProfileSnapshot: mocks.buildProfileSnapshot,
}));

vi.mock('../../config/env.js', () => ({
  getPowerSyncConfig: mocks.getPowerSyncConfig,
}));

describe('rebuildAllProfileSnapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildProfileSnapshot.mockResolvedValue({
      identityId: 'unused',
      snapshotKey: 'unused',
      version: '2026-05-19T00:00:00Z',
      manifestPath: 'manifest.json',
      databasePath: 'powersync.sqlite',
      checksumSha256: 'checksum',
    });
  });

  it('skips rebuilding when PowerSync credentials are incomplete', async () => {
    mocks.getPowerSyncConfig.mockReturnValue({
      url: undefined,
      privateKey: undefined,
      keyId: 'powersync-key',
    });

    const { rebuildAllProfileSnapshots } = await import('./snapshot-rebuild.job.js');
    await rebuildAllProfileSnapshots('/tmp/snapshots');

    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.buildProfileSnapshot).not.toHaveBeenCalled();
  });

  it('skips rebuilding when there are no active accounts', async () => {
    mocks.getPowerSyncConfig.mockReturnValue({
      url: 'http://localhost:8080',
      privateKey: 'private-key',
      keyId: 'powersync-key',
    });
    mocks.findMany.mockResolvedValue([]);

    const { rebuildAllProfileSnapshots } = await import('./snapshot-rebuild.job.js');
    await rebuildAllProfileSnapshots('/tmp/snapshots');

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });
    expect(mocks.buildProfileSnapshot).not.toHaveBeenCalled();
  });

  it('rebuilds snapshots for each active account using the configured PowerSync credentials', async () => {
    mocks.getPowerSyncConfig.mockReturnValue({
      url: 'http://localhost:8080',
      privateKey: 'private-key',
      keyId: 'powersync-key',
    });
    mocks.findMany.mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }, { id: 'user-3' }]);

    const { rebuildAllProfileSnapshots } = await import('./snapshot-rebuild.job.js');
    await rebuildAllProfileSnapshots('/tmp/snapshots');

    expect(mocks.buildProfileSnapshot).toHaveBeenCalledTimes(3);
    expect(mocks.buildProfileSnapshot).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        identityId: 'user-1',
        snapshotRootDir: '/tmp/snapshots',
        powersyncUrl: 'http://localhost:8080',
        privateKey: 'private-key',
        keyId: 'powersync-key',
        version: expect.any(String),
      }),
    );
    expect(mocks.buildProfileSnapshot).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        identityId: 'user-3',
        snapshotRootDir: '/tmp/snapshots',
      }),
    );
  });
});

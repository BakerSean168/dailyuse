import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DesktopFeatureChannels, SystemChannels } from '../../../shared/types/ipc-channels';

const ipcHandle = vi.fn();
const appGetVersion = vi.fn(() => '1.0.0');
const getLazyModuleStats = vi.fn(() => ({ loaded: 1 }));
const getIpcCache = vi.fn(() => ({
  getStats: () => ({ size: 0, hits: 0, misses: 0, hitRate: 0 }),
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: ipcHandle,
  },
  app: {
    getVersion: appGetVersion,
  },
}));

vi.mock('../../di', () => ({
  getLazyModuleStats,
}));

vi.mock('../../utils', () => ({
  getIpcCache,
}));

describe('registerSystemIpcHandlers', () => {
  beforeEach(() => {
    vi.resetModules();
    ipcHandle.mockClear();
  });

  it('registers all shared system and desktop feature handlers', async () => {
    const { registerSystemIpcHandlers } = await import('../system-handlers');

    registerSystemIpcHandlers(null, null, null);

    const channels = new Set(ipcHandle.mock.calls.map(([channel]) => channel as string));

    expect(channels).toEqual(
      new Set([...Object.values(SystemChannels), ...Object.values(DesktopFeatureChannels)]),
    );
  });

  it('is idempotent across repeated registration calls', async () => {
    const { registerSystemIpcHandlers } = await import('../system-handlers');

    registerSystemIpcHandlers(null, null, null);
    registerSystemIpcHandlers(null, null, null);

    expect(ipcHandle).toHaveBeenCalledTimes(
      Object.keys(SystemChannels).length + Object.keys(DesktopFeatureChannels).length,
    );
  });
});

import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DesktopFeatureChannels, SystemChannels } from '../../../shared/types/ipc-channels';

const mocks = vi.hoisted(() => ({
  ipcHandle: vi.fn(),
  appGetVersion: vi.fn(() => '1.0.0'),
  dialogShowOpenDialog: vi.fn(),
  dialogShowSaveDialog: vi.fn(),
  shellOpenPath: vi.fn(),
  getLazyModuleStats: vi.fn(() => ({ loaded: 1 })),
  getIpcCache: vi.fn(() => ({
    getStats: () => ({ size: 0, hits: 0, misses: 0, hitRate: 0 }),
  })),
  getSharedPathResolver: vi.fn(),
  updateUserFilesRootPath: vi.fn(),
  resolveDesktopUserFilesPath: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: mocks.ipcHandle,
  },
  app: {
    getVersion: mocks.appGetVersion,
  },
  dialog: {
    showOpenDialog: mocks.dialogShowOpenDialog,
    showSaveDialog: mocks.dialogShowSaveDialog,
  },
  shell: {
    openPath: mocks.shellOpenPath,
  },
}));

vi.mock('../../di', () => ({
  getLazyModuleStats: mocks.getLazyModuleStats,
}));

vi.mock('../../utils', () => ({
  getIpcCache: mocks.getIpcCache,
}));

vi.mock('../../runtime-init', () => ({
  getSharedPathResolver: mocks.getSharedPathResolver,
  updateUserFilesRootPath: mocks.updateUserFilesRootPath,
}));

vi.mock('../../user-data-path', () => ({
  resolveDesktopUserFilesPath: mocks.resolveDesktopUserFilesPath,
}));

function createSharedResolver(overrides?: Partial<ReturnType<typeof buildSharedResolver>>) {
  return {
    ...buildSharedResolver(),
    ...overrides,
  };
}

function buildSharedResolver() {
  const rootDir = path.join(os.tmpdir(), 'memoflow-user-files');
  return {
    userFilesRootDir: rootDir,
    userFilesExportsDir: path.join(rootDir, 'exports'),
    userFilesDownloadsDir: path.join(rootDir, 'downloads'),
    userFilesAttachmentsDir: path.join(rootDir, 'attachments'),
  };
}

type RegisteredHandler = (event: unknown, payload?: unknown) => Promise<unknown>;

function getRegisteredHandler(channel: string): RegisteredHandler {
  const entry = mocks.ipcHandle.mock.calls.find(([registeredChannel]) => registeredChannel === channel);
  expect(entry, `Expected handler for channel ${channel} to be registered`).toBeTruthy();
  return entry![1] as RegisteredHandler;
}

describe('registerSystemIpcHandlers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mocks.getSharedPathResolver.mockReturnValue(createSharedResolver());
    mocks.resolveDesktopUserFilesPath.mockReturnValue(path.join(os.tmpdir(), 'Memoflow Files Default'));
    mocks.dialogShowOpenDialog.mockResolvedValue({
      canceled: true,
      filePaths: [],
    });
    mocks.dialogShowSaveDialog.mockResolvedValue({
      canceled: true,
      filePath: null,
    });
    mocks.shellOpenPath.mockResolvedValue('');
  });

  it('registers all shared system and desktop feature handlers', async () => {
    const { registerSystemIpcHandlers } = await import('../system-handlers');

    registerSystemIpcHandlers(null, null, null);

    const channels = new Set(mocks.ipcHandle.mock.calls.map(([channel]) => channel as string));

    expect(channels).toEqual(
      new Set([...Object.values(SystemChannels), ...Object.values(DesktopFeatureChannels)]),
    );
  });

  it('is idempotent across repeated registration calls', async () => {
    const { registerSystemIpcHandlers } = await import('../system-handlers');

    registerSystemIpcHandlers(null, null, null);
    registerSystemIpcHandlers(null, null, null);

    expect(mocks.ipcHandle).toHaveBeenCalledTimes(
      Object.keys(SystemChannels).length + Object.keys(DesktopFeatureChannels).length,
    );
  });

  it('returns the current user-files path, default path, and custom flag', async () => {
    const currentPath = path.join(os.tmpdir(), 'Memoflow Files Custom');
    const defaultPath = path.join(os.tmpdir(), 'Memoflow Files Default');
    mocks.getSharedPathResolver.mockReturnValue(createSharedResolver({ userFilesRootDir: currentPath }));
    mocks.resolveDesktopUserFilesPath.mockReturnValue(defaultPath);

    const { registerSystemIpcHandlers } = await import('../system-handlers');
    registerSystemIpcHandlers(null, null, null);

    const handler = getRegisteredHandler(SystemChannels.USER_FILES_GET_PATH);
    const result = await handler({});

    expect(result).toEqual({
      currentPath,
      defaultPath,
      isCustom: true,
    });
  });

  it('updates the runtime user-files root when a new directory is selected', async () => {
    const selectedPath = path.join(os.tmpdir(), 'Memoflow Files Picked');
    mocks.dialogShowOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: [selectedPath],
    });

    const { registerSystemIpcHandlers } = await import('../system-handlers');
    registerSystemIpcHandlers(null, null, null);

    const handler = getRegisteredHandler(SystemChannels.USER_FILES_PICK_DIRECTORY);
    const result = await handler({});

    expect(mocks.updateUserFilesRootPath).toHaveBeenCalledWith(selectedPath);
    expect(result).toEqual({
      canceled: false,
      path: selectedPath,
    });
  });

  it('does not update the runtime user-files root when the picker is canceled', async () => {
    mocks.dialogShowOpenDialog.mockResolvedValue({
      canceled: true,
      filePaths: [],
    });

    const { registerSystemIpcHandlers } = await import('../system-handlers');
    registerSystemIpcHandlers(null, null, null);

    const handler = getRegisteredHandler(SystemChannels.USER_FILES_PICK_DIRECTORY);
    const result = await handler({});

    expect(mocks.updateUserFilesRootPath).not.toHaveBeenCalled();
    expect(result).toEqual({
      canceled: true,
      path: null,
    });
  });

  it('resets the runtime user-files root back to the default path', async () => {
    const defaultPath = path.join(os.tmpdir(), 'Memoflow Files Default');
    mocks.resolveDesktopUserFilesPath.mockReturnValue(defaultPath);

    const { registerSystemIpcHandlers } = await import('../system-handlers');
    registerSystemIpcHandlers(null, null, null);

    const handler = getRegisteredHandler(SystemChannels.USER_FILES_RESET_PATH);
    const result = await handler({});

    expect(mocks.updateUserFilesRootPath).toHaveBeenCalledWith(null);
    expect(result).toEqual({ path: defaultPath });
  });

  it('opens the active user-files root directory in the shell', async () => {
    const currentPath = path.join(os.tmpdir(), 'Memoflow Files Current');
    mocks.getSharedPathResolver.mockReturnValue(createSharedResolver({ userFilesRootDir: currentPath }));

    const { registerSystemIpcHandlers } = await import('../system-handlers');
    registerSystemIpcHandlers(null, null, null);

    const handler = getRegisteredHandler(SystemChannels.USER_FILES_OPEN_DIRECTORY);
    await handler({});

    expect(mocks.shellOpenPath).toHaveBeenCalledWith(currentPath);
  });
});

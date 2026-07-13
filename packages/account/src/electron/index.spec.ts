import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountChannels, type IElectronModuleContext } from '@dailyuse/contracts/electron';
import { ok } from '@dailyuse/contracts/result';

const mocks = vi.hoisted(() => {
  const getProfile = vi.fn();
  const start = vi.fn();
  const dispose = vi.fn();
  const handle = vi.fn();
  const removeHandler = vi.fn();

  return {
    getProfile,
    start,
    dispose,
    handle,
    removeHandler,
    createAccountPowerSyncModule: vi.fn(() => ({
      api: {
        listAccounts: vi.fn(),
        getProfile,
        updateProfile: vi.fn(),
        updateSettings: vi.fn(),
        checkAvailability: vi.fn(),
        closeAccount: vi.fn(),
      },
      start,
      dispose,
    })),
  };
});

vi.mock('electron', () => ({
  ipcMain: {
    handle: mocks.handle,
    removeHandler: mocks.removeHandler,
  },
}));

vi.mock('../server/infrastructure', () => ({
  createAccountPowerSyncModule: mocks.createAccountPowerSyncModule,
}));

import { AccountElectronModule } from './index';

describe('AccountElectronModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    AccountElectronModule.destroy?.();
  });

  it('maps a missing local profile to NOT_FOUND on GET_ME', async () => {
    mocks.getProfile.mockResolvedValue(ok(null));
    const context = {
      db: {},
      auth: {
        requireRequestContext: vi.fn().mockResolvedValue({ identityId: 'identity-1' }),
      },
    } as unknown as IElectronModuleContext;

    AccountElectronModule.register(context);
    const registration = mocks.handle.mock.calls.find(
      ([channel]) => channel === AccountChannels.GET_ME,
    );
    expect(registration).toBeDefined();

    const result = await registration?.[1]();

    expect(mocks.getProfile).toHaveBeenCalledWith({ identityId: 'identity-1' });
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND' },
    });
  });
});

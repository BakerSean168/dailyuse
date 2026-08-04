import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountChannels, type IElectronModuleContext } from '@memoflow/contracts/electron';
import { ok } from '@memoflow/contracts/result';

const mocks = vi.hoisted(() => {
  const getProfile = vi.fn();
  const closeAccount = vi.fn();
  const start = vi.fn();
  const dispose = vi.fn();
  const handle = vi.fn();
  const removeHandler = vi.fn();

  return {
    getProfile,
    closeAccount,
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
        closeAccount,
      },
      useCases: { updateProfile: { execute: vi.fn() } },
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
  PowerSyncAccountRepository: class {
    findById = vi.fn();
  },
}));

import { AccountElectronModule, createAccountElectronModule } from './index';

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

  it('rejects guest cloud account closure before any remote call', async () => {
    const closeCloudAccount = vi.fn();
    const module = createAccountElectronModule({
      getCloudAccountId: () => null,
      getCloudAccessToken: async () => 'token',
      pushCloudProfile: vi.fn(),
      closeCloudAccount,
    });
    const context = {
      db: {
        getOptional: vi.fn().mockResolvedValue(null),
      },
      auth: {
        requireRequestContext: vi.fn().mockResolvedValue({ identityId: 'guest-1' }),
      },
    } as unknown as IElectronModuleContext;
    module.register(context);
    const registration = mocks.handle.mock.calls.find(
      ([channel]) => channel === AccountChannels.CLOSE,
    );

    const result = await registration?.[1](undefined, { reason: 'No longer needed' });

    expect(result).toMatchObject({ ok: false, error: { code: 'CLOUD_ACCOUNT_REQUIRED' } });
    expect(closeCloudAccount).not.toHaveBeenCalled();
    await module.destroy?.();
  });

  it('requires a live cloud session before closing a registered account', async () => {
    const closeCloudAccount = vi.fn();
    const module = createAccountElectronModule({
      getCloudAccountId: () => 'cloud-1',
      getCloudAccessToken: async () => null,
      pushCloudProfile: vi.fn(),
      closeCloudAccount,
    });
    const context = {
      db: { getOptional: vi.fn().mockResolvedValue(null) },
      auth: {
        requireRequestContext: vi.fn().mockResolvedValue({ identityId: 'cloud-1' }),
      },
    } as unknown as IElectronModuleContext;
    module.register(context);
    const registration = mocks.handle.mock.calls.find(
      ([channel]) => channel === AccountChannels.CLOSE,
    );

    const result = await registration?.[1](undefined, { reason: 'No longer needed' });

    expect(result).toMatchObject({ ok: false, error: { code: 'REAUTH_REQUIRED' } });
    expect(closeCloudAccount).not.toHaveBeenCalled();
    await module.destroy?.();
  });

  it('closes cloud first, updates the local projection, then disconnects sync', async () => {
    mocks.closeAccount.mockResolvedValue(ok(undefined));
    const closeCloudAccount = vi.fn().mockResolvedValue(undefined);
    const afterCloudAccountClosed = vi.fn().mockResolvedValue(undefined);
    const module = createAccountElectronModule({
      getCloudAccountId: () => 'cloud-1',
      getCloudAccessToken: async () => 'token',
      pushCloudProfile: vi.fn(),
      closeCloudAccount,
      afterCloudAccountClosed,
    });
    const context = {
      db: { getOptional: vi.fn().mockResolvedValue(null) },
      auth: {
        requireRequestContext: vi.fn().mockResolvedValue({ identityId: 'cloud-1' }),
      },
    } as unknown as IElectronModuleContext;
    module.register(context);
    const registration = mocks.handle.mock.calls.find(
      ([channel]) => channel === AccountChannels.CLOSE,
    );

    const result = await registration?.[1](undefined, { reason: 'No longer needed' });

    expect(result).toEqual(ok(null));
    expect(closeCloudAccount).toHaveBeenCalledWith('token', { reason: 'No longer needed' });
    expect(mocks.closeAccount).toHaveBeenCalledWith(
      { reason: 'No longer needed' },
      { identityId: 'cloud-1' },
    );
    expect(afterCloudAccountClosed).toHaveBeenCalledOnce();
    await module.destroy?.();
  });
});

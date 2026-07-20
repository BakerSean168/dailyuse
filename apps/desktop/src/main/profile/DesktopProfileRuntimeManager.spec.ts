import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SharedPathResolver } from '../paths';
import { ProfileRegistry } from './profile-registry';
import { DesktopProfileRuntimeManager } from './desktop-profile-runtime-manager';

const mocks = vi.hoisted(() => {
  const bootstrapInstances: Array<{ init: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> }> = [];
  return {
    openPowerSyncLocalOnly: vi.fn(),
    ensurePowerSyncSyncMode: vi.fn(),
    shutdownPowerSync: vi.fn(),
    hydrateIfNeeded: vi.fn(),
    createDesktopProfileAuthService: vi.fn(),
    stopScheduleRuntime: vi.fn(),
    bootstrapRegisterModules: vi.fn(),
    bootstrapInstances,
  };
});

vi.mock('../database/powersync', () => ({
  openPowerSyncLocalOnly: mocks.openPowerSyncLocalOnly,
  ensurePowerSyncSyncMode: mocks.ensurePowerSyncSyncMode,
  shutdownPowerSync: mocks.shutdownPowerSync,
}));

vi.mock('./profile-snapshot-service', () => ({
  ProfileSnapshotService: class {
    hydrateIfNeeded = mocks.hydrateIfNeeded;
  },
}));

vi.mock('../modules/authentication/application/create-desktop-profile-auth-service', () => ({
  createDesktopProfileAuthService: mocks.createDesktopProfileAuthService,
}));

vi.mock('../bootstrap', () => ({
  ElectronBootstrapper: class {
    readonly db: unknown;
    readonly init = vi.fn(async () => undefined);
    readonly destroy = vi.fn(async () => undefined);

    constructor(db: unknown) {
      this.db = db;
      mocks.bootstrapInstances.push({ init: this.init, destroy: this.destroy });
    }
  },
}));

vi.mock('@dailyuse/schedule/electron', () => ({
  stopScheduleRuntime: mocks.stopScheduleRuntime,
}));

function createSharedResolver(rootDir: string): SharedPathResolver {
  return {
    rootDir,
    sharedDir: path.join(rootDir, 'shared'),
    authDir: path.join(rootDir, 'shared', 'auth'),
    configDir: path.join(rootDir, 'shared', 'config'),
    uiDir: path.join(rootDir, 'shared', 'ui'),
    profilesRegistryDir: path.join(rootDir, 'shared', 'profiles'),
    rememberedAccountsPath: path.join(rootDir, 'shared', 'auth', 'remembered-accounts.json'),
    deviceIdPath: path.join(rootDir, 'shared', 'auth', 'device-id'),
    runtimeConfigPath: path.join(rootDir, 'shared', 'config', 'desktop-runtime.json'),
    loginWindowStatePath: path.join(rootDir, 'shared', 'ui', 'login-window-state.json'),
    registerWindowStatePath: path.join(rootDir, 'shared', 'ui', 'register-window-state.json'),
    registryPath: path.join(rootDir, 'shared', 'profiles', 'registry.json'),
    cacheDir: path.join(rootDir, 'cache'),
    snapshotStagingDir: path.join(rootDir, 'cache', 'snapshot-staging'),
    downloadsDir: path.join(rootDir, 'cache', 'downloads'),
    tempDir: path.join(rootDir, 'cache', 'temp'),
    logsDir: path.join(rootDir, 'logs'),
    userFilesRootDir: path.join(rootDir, 'user-files'),
    userFilesExportsDir: path.join(rootDir, 'user-files', 'exports'),
    userFilesDownloadsDir: path.join(rootDir, 'user-files', 'downloads'),
    userFilesAttachmentsDir: path.join(rootDir, 'user-files', 'attachments'),
  };
}

describe('DesktopProfileRuntimeManager', () => {
  let rootDir: string;

  function createMockTokenManager() {
    return {
      switchToProfile: vi.fn(),
      clearForProfileSwitch: vi.fn().mockResolvedValue(undefined),
    };
  }

  function createMockRememberedAccountsService() {
    return { list: vi.fn().mockResolvedValue([]) };
  }

  function createMockNetworkStateManager() {
    return { isOnline: vi.fn(() => true) };
  }

  function createMockWindowManager() {
    return {
      getMainWindow: vi.fn(() => null),
      setRuntimeManager: vi.fn(),
    };
  }

  function createRuntimeManager() {
    const sharedResolver = createSharedResolver(rootDir);
    const profileRegistry = new ProfileRegistry(sharedResolver);
    const tokenManager = createMockTokenManager() as never;
    const rememberedAccountsService = createMockRememberedAccountsService() as never;
    const networkStateManager = createMockNetworkStateManager() as never;
    const windowManager = createMockWindowManager() as never;
    return new DesktopProfileRuntimeManager(sharedResolver, profileRegistry, tokenManager, rememberedAccountsService, networkStateManager, windowManager);
  }

  beforeEach(async () => {
    rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'desktop-profile-runtime-'));
    mocks.bootstrapInstances.length = 0;
    vi.clearAllMocks();

    mocks.openPowerSyncLocalOnly.mockImplementation(async (dbPath: string) => ({ dbPath }));
    mocks.ensurePowerSyncSyncMode.mockResolvedValue(undefined);
    mocks.shutdownPowerSync.mockResolvedValue(undefined);
    mocks.hydrateIfNeeded.mockResolvedValue({
      hydrated: false,
      skippedReason: 'snapshot-unavailable',
      metadata: null,
    });
    mocks.createDesktopProfileAuthService.mockImplementation(() => ({
      cleanup: vi.fn(),
      cleanupSessionManager: vi.fn(),
      configureAndActivateProfile: vi.fn().mockResolvedValue(undefined),
    }));
  });

  afterEach(async () => {
    await fs.promises.rm(rootDir, { recursive: true, force: true });
  });

  it('prepares and activates a profile through the profile-scoped runtime seam', async () => {
    const runtimeManager = createRuntimeManager();
    runtimeManager.setModuleRegistration(mocks.bootstrapRegisterModules);

    const prepared = await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
      identifier: 'alice@example.com',
    });

    expect(prepared.descriptor.identityId).toBe('identity-a');
    expect(fs.existsSync(prepared.profileResolver.profileDir)).toBe(true);
    expect(mocks.openPowerSyncLocalOnly).toHaveBeenCalledWith(prepared.profileResolver.dbPath);
    expect(mocks.createDesktopProfileAuthService).toHaveBeenCalled();
    expect(runtimeManager.getPreparedAuthService()).toBe(prepared.authService);

    await runtimeManager.activatePreparedProfile({ syncMode: 'online' });

    expect(mocks.ensurePowerSyncSyncMode).toHaveBeenCalledOnce();
    expect(mocks.bootstrapRegisterModules).toHaveBeenCalledWith(
      expect.any(Object),
      prepared.db,
      prepared.profileResolver,
    );
    expect(mocks.bootstrapInstances).toHaveLength(1);
    expect(mocks.bootstrapInstances[0]!.init).toHaveBeenCalledOnce();
    expect(runtimeManager.getActiveProfileId()).toBe(prepared.descriptor.profileId);
    expect(runtimeManager.getPreparedAuthService()).toBeNull();

    const activeDescriptor = await runtimeManager.getActiveProfileDescriptor();
    expect(activeDescriptor?.identityId).toBe('identity-a');
    expect(activeDescriptor?.status).toBe('ready');
  });

  it('deactivates the active runtime before preparing a different profile', async () => {
    const runtimeManager = createRuntimeManager();

    const preparedA = await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
      identifier: 'alice@example.com',
    });
    await runtimeManager.activatePreparedProfile({ syncMode: 'local' });

    const authServiceA = preparedA.authService as { cleanup: ReturnType<typeof vi.fn>; cleanupSessionManager: ReturnType<typeof vi.fn> };

    const preparedB = await runtimeManager.prepareProfile('identity-b', {
      displayName: 'Bob',
      identifier: 'bob@example.com',
    });

    expect(mocks.bootstrapInstances[0]!.destroy).toHaveBeenCalledOnce();
    expect(authServiceA.cleanupSessionManager).toHaveBeenCalled();
    expect(authServiceA.cleanup).toHaveBeenCalledOnce();
    expect(mocks.shutdownPowerSync).toHaveBeenCalled();
    // Auth service teardown is handled via onAuthServiceChanged callback
    expect(authServiceA.cleanup).toHaveBeenCalledOnce();
    expect(runtimeManager.getActiveProfileId()).toBeNull();
    expect(preparedB.descriptor.identityId).toBe('identity-b');
    expect(preparedB.profileResolver.dbPath).not.toBe(preparedA.profileResolver.dbPath);
    expect(mocks.openPowerSyncLocalOnly).toHaveBeenLastCalledWith(preparedB.profileResolver.dbPath);
  });

  it('deactivateProfile clears the active profile registration without removing prepared state', async () => {
    const runtimeManager = createRuntimeManager();

    const prepared = await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
    });
    await runtimeManager.activatePreparedProfile({ syncMode: 'local' });

    await runtimeManager.deactivateProfile();

    expect(runtimeManager.getActiveProfileId()).toBeNull();
    expect(await runtimeManager.getActiveProfileDescriptor()).toBeNull();
    expect(fs.existsSync(prepared.profileResolver.dbDir)).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────
  // Multi-account lifecycle: logout does NOT clear local DB
  // ──────────────────────────────────────────────────────────────────

  it('logout (deactivateProfile) preserves per-profile directory and DB files', async () => {
    const runtimeManager = createRuntimeManager();

    const prepared = await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
      identifier: 'alice@example.com',
    });
    await runtimeManager.activatePreparedProfile({ syncMode: 'local' });

    // Simulate a DB file existing on disk
    await fs.promises.mkdir(prepared.profileResolver.dbDir, { recursive: true });
    await fs.promises.writeFile(prepared.profileResolver.dbPath, 'fake-sqlite-data', 'utf8');

    await runtimeManager.deactivateProfile();

    // Profile directory and DB should still exist after logout
    expect(fs.existsSync(prepared.profileResolver.profileDir)).toBe(true);
    expect(fs.existsSync(prepared.profileResolver.dbPath)).toBe(true);
    expect(fs.readFileSync(prepared.profileResolver.dbPath, 'utf8')).toBe('fake-sqlite-data');
  });

  // ──────────────────────────────────────────────────────────────────
  // Multi-account lifecycle: removeProfile deletes profile data
  // ──────────────────────────────────────────────────────────────────

  it('removeProfile deletes profile directory and registry entry', async () => {
    const runtimeManager = createRuntimeManager();

    const prepared = await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
      identifier: 'alice@example.com',
    });
    await runtimeManager.activatePreparedProfile({ syncMode: 'local' });

    // Write some data to the profile directory
    await fs.promises.writeFile(prepared.profileResolver.dbPath, 'db-data', 'utf8');

    // Must deactivate before removing
    await runtimeManager.deactivateProfile();
    await runtimeManager.removeProfile('identity-a');

    // Profile directory should be gone
    expect(fs.existsSync(prepared.profileResolver.profileDir)).toBe(false);

    // Registry should no longer contain the profile
    const registry = new ProfileRegistry(createSharedResolver(rootDir));
    expect(await registry.find('identity-a')).toBeNull();
  });

  it('removeProfile throws when trying to remove the active profile', async () => {
    const runtimeManager = createRuntimeManager();

    await runtimeManager.prepareProfile('identity-a', { displayName: 'Alice' });
    await runtimeManager.activatePreparedProfile({ syncMode: 'local' });

    await expect(runtimeManager.removeProfile('identity-a')).rejects.toThrow(
      'Cannot remove active profile',
    );
  });

  // ──────────────────────────────────────────────────────────────────
  // Multi-account switching: two profiles coexist on disk
  // ──────────────────────────────────────────────────────────────────

  it('switching between two accounts preserves both profile directories', async () => {
    const runtimeManager = createRuntimeManager();

    // Activate profile A
    const preparedA = await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
      identifier: 'alice@example.com',
    });
    await runtimeManager.activatePreparedProfile({ syncMode: 'local' });
    await fs.promises.writeFile(preparedA.profileResolver.dbPath, 'db-a', 'utf8');

    // Switch to profile B (this deactivates A implicitly during prepare)
    const preparedB = await runtimeManager.prepareProfile('identity-b', {
      displayName: 'Bob',
      identifier: 'bob@example.com',
    });
    await runtimeManager.activatePreparedProfile({ syncMode: 'local' });
    await fs.promises.writeFile(preparedB.profileResolver.dbPath, 'db-b', 'utf8');

    // Both profile directories and their data should still exist
    expect(fs.existsSync(preparedA.profileResolver.profileDir)).toBe(true);
    expect(fs.existsSync(preparedB.profileResolver.profileDir)).toBe(true);
    expect(fs.readFileSync(preparedA.profileResolver.dbPath, 'utf8')).toBe('db-a');
    expect(fs.readFileSync(preparedB.profileResolver.dbPath, 'utf8')).toBe('db-b');

    // Active profile should be B
    expect(runtimeManager.getActiveProfileId()).toBe(preparedB.descriptor.profileId);
  });

  // ──────────────────────────────────────────────────────────────────
  // Re-preparing the same identity returns existing prepared runtime
  // ──────────────────────────────────────────────────────────────────

  it('prepareProfile returns same prepared runtime when called with same identityId', async () => {
    const runtimeManager = createRuntimeManager();

    const first = await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
    });
    const second = await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
    });

    expect(second).toBe(first);
    // Only one DB open call
    expect(mocks.openPowerSyncLocalOnly).toHaveBeenCalledTimes(1);
  });

  it('prepareProfile returns active runtime when called with the active identityId', async () => {
    const runtimeManager = createRuntimeManager();

    const prepared = await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
    });
    await runtimeManager.activatePreparedProfile({ syncMode: 'local' });

    const reprepared = await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
    });

    // Should return the active runtime, not create a new one
    expect(reprepared.descriptor.profileId).toBe(prepared.descriptor.profileId);
    expect(mocks.openPowerSyncLocalOnly).toHaveBeenCalledTimes(1);
  });

  // ──────────────────────────────────────────────────────────────────
  // discardPreparedProfile
  // ──────────────────────────────────────────────────────────────────

  it('discardPreparedProfile cleans up without affecting the filesystem', async () => {
    const runtimeManager = createRuntimeManager();

    const prepared = await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
    });

    await runtimeManager.discardPreparedProfile();

    expect(runtimeManager.getPreparedAuthService()).toBeNull();
    expect(runtimeManager.getActiveProfileId()).toBeNull();
    // Profile directory should still exist
    expect(fs.existsSync(prepared.profileResolver.profileDir)).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────
  // activatePreparedProfile throws when nothing is prepared
  // ──────────────────────────────────────────────────────────────────

  it('activatePreparedProfile throws when no profile is prepared', async () => {
    const runtimeManager = createRuntimeManager();

    await expect(
      runtimeManager.activatePreparedProfile({ syncMode: 'local' }),
    ).rejects.toThrow('No prepared profile');
  });

  // ──────────────────────────────────────────────────────────────────
  // Per-profile directory isolation
  // ──────────────────────────────────────────────────────────────────

  it('ensures per-profile directory structure is created during prepare', async () => {
    const runtimeManager = createRuntimeManager();

    const prepared = await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
    });

    const r = prepared.profileResolver;
    expect(fs.existsSync(r.profileDir)).toBe(true);
    expect(fs.existsSync(r.authDir)).toBe(true);
    expect(fs.existsSync(r.dbDir)).toBe(true);
    expect(fs.existsSync(r.storageDir)).toBe(true);
    expect(fs.existsSync(r.repositoryStorageDir)).toBe(true);
    expect(fs.existsSync(r.knowledgeNotesDir)).toBe(true);
    expect(fs.existsSync(r.attachmentsDir)).toBe(true);
    expect(fs.existsSync(r.uiDir)).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────
  // Guest profile
  // ──────────────────────────────────────────────────────────────────

  it('prepareGuestProfile creates a guest profile with deterministic identity', async () => {
    const runtimeManager = createRuntimeManager();

    const guestA = await runtimeManager.prepareGuestProfile();
    expect(guestA.descriptor.displayName).toBe('Guest');
    expect(guestA.descriptor.identityId).toBe('__desktop_guest_profile__');

    // Preparing guest again returns the same prepared runtime
    const guestB = await runtimeManager.prepareGuestProfile();
    expect(guestB).toBe(guestA);
  });

  it('upgradeGuestProfileToOnlineIdentity keeps profileId (Vault does not move)', async () => {
    const runtimeManager = createRuntimeManager();
    const guest = await runtimeManager.prepareGuestProfile();
    const guestProfileId = guest.descriptor.profileId;
    const guestDir = guest.profileResolver.profileDir;

    const upgraded = await runtimeManager.upgradeGuestProfileToOnlineIdentity({
      onlineIdentityId: 'IdentityId_online_guest_upgrade',
      displayName: 'Upgraded',
      identifier: 'upgrade@example.com',
    });

    expect(upgraded.descriptor.profileId).toBe(guestProfileId);
    expect(upgraded.descriptor.identityId).toBe('IdentityId_online_guest_upgrade');
    expect(upgraded.profileResolver.profileDir).toBe(guestDir);
    expect(runtimeManager.isGuestProfileIdentity(upgraded.descriptor.identityId)).toBe(false);
  });

  it('upgradeGuestProfileToOnlineIdentity fails safely when no guest profile exists', async () => {
    const runtimeManager = createRuntimeManager();
    await expect(
      runtimeManager.upgradeGuestProfileToOnlineIdentity({
        onlineIdentityId: 'IdentityId_online_guest_upgrade',
      }),
    ).rejects.toThrow(/No guest profile exists/);
  });

  // ──────────────────────────────────────────────────────────────────
  // Activation failure marks profile as error
  // ──────────────────────────────────────────────────────────────────

  it('marks profile as error and discards prepared runtime on activation failure', async () => {
    const runtimeManager = createRuntimeManager();

    mocks.ensurePowerSyncSyncMode.mockRejectedValueOnce(new Error('sync-failed'));

    await runtimeManager.prepareProfile('identity-a', {
      displayName: 'Alice',
    });

    await expect(
      runtimeManager.activatePreparedProfile({ syncMode: 'online' }),
    ).rejects.toThrow('sync-failed');

    expect(runtimeManager.getActiveProfileId()).toBeNull();
    expect(runtimeManager.getPreparedAuthService()).toBeNull();

    const registry = new ProfileRegistry(createSharedResolver(rootDir));
    const descriptor = await registry.find('identity-a');
    expect(descriptor?.status).toBe('error');
  });
});

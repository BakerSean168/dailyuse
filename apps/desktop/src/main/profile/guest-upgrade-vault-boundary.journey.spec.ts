/**
 * Same-fixture guest → online upgrade journey for vault ownership boundaries.
 * Complements app-vue three-login journey (UI matrix) with Desktop runtime evidence:
 * profileId/vaultDir stable, guest identity cleared, cloud placeholder tokens blocked.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SharedPathResolver } from '../paths';
import { ProfileRegistry } from './profile-registry';
import { DesktopProfileRuntimeManager } from './desktop-profile-runtime-manager';
import {
  GUEST_ACCESS_TOKEN,
  LOCAL_ACCESS_TOKEN,
  toCloudAccessToken,
} from '../modules/authentication/infrastructure/session-types';

const FIXTURE = {
  email: 'journey.user@example.com',
  onlineIdentityId: 'IdentityId_journey_online_1',
  displayName: 'Journey User',
} as const;

const mocks = vi.hoisted(() => {
  const bootstrapInstances: Array<{
    init: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  }> = [];
  return {
    openPowerSyncLocalOnly: vi.fn(),
    ensurePowerSyncSyncMode: vi.fn(),
    shutdownPowerSync: vi.fn(),
    hydrateIfNeeded: vi.fn(),
    createDesktopProfileAuthService: vi.fn(),
    stopScheduleRuntime: vi.fn(),
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

vi.mock('@memoflow/schedule/electron', () => ({
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

describe('guest upgrade vault boundary journey (same fixture)', () => {
  let rootDir: string;

  function createRuntimeManager() {
    const sharedResolver = createSharedResolver(rootDir);
    const profileRegistry = new ProfileRegistry(sharedResolver);
    const tokenManager = {
      switchToProfile: vi.fn(),
      clearForProfileSwitch: vi.fn().mockResolvedValue(undefined),
    } as never;
    const rememberedAccountsService = { list: vi.fn().mockResolvedValue([]) } as never;
    const networkStateManager = { isOnline: vi.fn(() => true) } as never;
    const windowManager = {
      getMainWindow: vi.fn(() => null),
      setRuntimeManager: vi.fn(),
    } as never;
    return new DesktopProfileRuntimeManager(
      sharedResolver,
      profileRegistry,
      tokenManager,
      rememberedAccountsService,
      networkStateManager,
      windowManager,
    );
  }

  beforeEach(async () => {
    rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'guest-upgrade-journey-'));
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

  it('rebinds guest ownership without moving Vault and blocks guest/offline cloud tokens', async () => {
    const runtimeManager = createRuntimeManager();

    const guest = await runtimeManager.prepareGuestProfile();
    const guestProfileId = guest.descriptor.profileId;
    const guestDir = guest.profileResolver.profileDir;
    const vaultMarker = path.join(guestDir, 'vault-marker.txt');
    await fs.promises.writeFile(vaultMarker, 'local-only-content', 'utf8');

    expect(runtimeManager.isGuestProfileIdentity(guest.descriptor.identityId)).toBe(true);
    expect(toCloudAccessToken(GUEST_ACCESS_TOKEN)).toBeNull();
    expect(toCloudAccessToken(LOCAL_ACCESS_TOKEN)).toBeNull();

    const upgraded = await runtimeManager.upgradeGuestProfileToOnlineIdentity({
      onlineIdentityId: FIXTURE.onlineIdentityId,
      displayName: FIXTURE.displayName,
      identifier: FIXTURE.email,
    });

    expect(upgraded.descriptor.profileId).toBe(guestProfileId);
    expect(upgraded.profileResolver.profileDir).toBe(guestDir);
    expect(upgraded.descriptor.identityId).toBe(FIXTURE.onlineIdentityId);
    expect(runtimeManager.isGuestProfileIdentity(upgraded.descriptor.identityId)).toBe(false);
    expect(fs.readFileSync(vaultMarker, 'utf8')).toBe('local-only-content');

    // Online sessions may use real access tokens for cloud APIs.
    expect(toCloudAccessToken('eyJhbGciOiJIUzI1NiJ9.online.token')).toBe(
      'eyJhbGciOiJIUzI1NiJ9.online.token',
    );
  });
});

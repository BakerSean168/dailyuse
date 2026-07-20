import fs from 'node:fs';
import type { PowerSyncDatabase } from '@powersync/node';
import { createLogger } from '@dailyuse/utils/logger';
import { stopScheduleRuntime } from '@dailyuse/schedule/electron';
import {
  type SharedPathResolver,
  type ProfilePathResolver,
  createProfilePathResolver,
  ensureProfileDirs,
} from '../paths';
import { ProfileRegistry, type ProfileDescriptor } from './profile-registry';
import { ProfileSnapshotService } from './profile-snapshot-service';
import { ElectronBootstrapper } from '../bootstrap';
import { DesktopAuthContextProvider } from '../auth/desktop-auth-context';
import type {
  TokenManager,
  RememberedAccountsService,
  NetworkStateManager,
} from '../modules/authentication/infrastructure';
import { createDesktopProfileAuthService } from '../modules/authentication/application/create-desktop-profile-auth-service';
import type { AuthDesktopApplicationService } from '../modules/authentication/application/auth-desktop-application-service';
import type { WindowManager } from '../lifecycle/window-manager';
import {
  openPowerSyncLocalOnly,
  ensurePowerSyncSyncMode,
  shutdownPowerSync,
} from '../database/powersync';

const logger = createLogger('DesktopProfileRuntimeManager');
const GUEST_PROFILE_IDENTITY = '__desktop_guest_profile__';

export interface PreparedProfileRuntime {
  descriptor: ProfileDescriptor;
  profileResolver: ProfilePathResolver;
  db: PowerSyncDatabase;
  authService: AuthDesktopApplicationService;
  authContextProvider: DesktopAuthContextProvider;
}

interface PrepareProfileOptions {
  displayName?: string;
  identifier?: string | null;
  snapshotAccessToken?: string | null;
}

interface ActiveProfileRuntime extends PreparedProfileRuntime {
  bootstrapper: ElectronBootstrapper;
}

type ProfileModuleRegistration = (
  bootstrapper: ElectronBootstrapper,
  db: PowerSyncDatabase,
  profilePaths: ProfilePathResolver,
) => Promise<void>;

/**
 * DesktopProfileRuntimeManager — the single owner of desktop profile lifecycle.
 *
 * Shell auth prepares a profile first. Only after successful authentication
 * does the manager activate that prepared runtime into the full business runtime.
 */
export class DesktopProfileRuntimeManager {
  private readonly sharedResolver: SharedPathResolver;
  private readonly profileRegistry: ProfileRegistry;
  private readonly tokenManager: TokenManager;
  private readonly rememberedAccountsService: RememberedAccountsService;
  private readonly networkStateManager: NetworkStateManager;
  private readonly profileSnapshotService = new ProfileSnapshotService();

  private activeRuntime: ActiveProfileRuntime | null = null;
  private preparedRuntime: PreparedProfileRuntime | null = null;
  private activationLock: Promise<void> | null = null;
  private registerModules: ProfileModuleRegistration | null = null;

  /** Called when the auth service changes (set during open, cleared during teardown). */
  onAuthServiceChanged: ((service: AuthDesktopApplicationService | null) => void) | null = null;

  constructor(
    sharedResolver: SharedPathResolver,
    profileRegistry: ProfileRegistry,
    tokenManager: TokenManager,
    rememberedAccountsService: RememberedAccountsService,
    networkStateManager: NetworkStateManager,
    private readonly windowManager: WindowManager,
  ) {
    this.sharedResolver = sharedResolver;
    this.profileRegistry = profileRegistry;
    this.tokenManager = tokenManager;
    this.rememberedAccountsService = rememberedAccountsService;
    this.networkStateManager = networkStateManager;
  }

  setModuleRegistration(fn: ProfileModuleRegistration): void {
    this.registerModules = fn;
  }

  getSharedResolver(): SharedPathResolver {
    return this.sharedResolver;
  }

  getRememberedAccountsService(): RememberedAccountsService {
    return this.rememberedAccountsService;
  }

  getNetworkStateManager(): NetworkStateManager {
    return this.networkStateManager;
  }

  getActiveProfileResolver(): ProfilePathResolver | null {
    return this.activeRuntime?.profileResolver ?? null;
  }

  getActiveProfileId(): string | null {
    return this.activeRuntime?.descriptor.profileId ?? null;
  }

  getBootstrapper(): ElectronBootstrapper | null {
    return this.activeRuntime?.bootstrapper ?? null;
  }

  getPreparedAuthService(): AuthDesktopApplicationService | null {
    return this.preparedRuntime?.authService ?? null;
  }

  getActiveAuthService(): AuthDesktopApplicationService | null {
    return this.activeRuntime?.authService ?? null;
  }

  getCurrentAuthService(): AuthDesktopApplicationService | null {
    return this.activeRuntime?.authService ?? this.preparedRuntime?.authService ?? null;
  }

  getActiveProfileDescriptor(): Promise<ProfileDescriptor | null> {
    return this.profileRegistry.getActiveProfile();
  }

  async findRegisteredProfileByIdentifier(identifier: string): Promise<ProfileDescriptor | null> {
    return await this.profileRegistry.findByIdentifier(identifier);
  }

  async prepareProfile(
    identityId: string,
    options?: PrepareProfileOptions,
  ): Promise<PreparedProfileRuntime> {
    if (this.activationLock) {
      await this.activationLock;
    }

    if (this.activeRuntime?.descriptor.identityId === identityId) {
      return this.activeRuntime;
    }

    if (this.preparedRuntime?.descriptor.identityId === identityId) {
      return this.preparedRuntime;
    }

    if (this.activeRuntime) {
      await this.deactivateProfile();
    }

    await this.disposePreparedRuntime();

    const descriptor = await this.profileRegistry.register(
      identityId,
      options?.displayName ?? options?.identifier ?? identityId,
      options?.identifier,
    );

    const profileResolver = createProfilePathResolver(
      this.sharedResolver.rootDir,
      descriptor.profileId,
    );
    ensureProfileDirs(profileResolver);

    const snapshotResult = await this.hydrateProfileSnapshot(
      descriptor,
      profileResolver,
      options?.snapshotAccessToken,
    );

    const { db, authService, authContextProvider } =
      await this.openProfileResources(profileResolver);

    this.preparedRuntime = { descriptor, profileResolver, db, authService, authContextProvider };
    await this.profileRegistry.markReady(descriptor.profileId);

    logger.info('Profile prepared', {
      profileId: descriptor.profileId,
      identityId: descriptor.identityId,
      snapshotHydrated: snapshotResult.hydrated,
      snapshotSkippedReason: snapshotResult.skippedReason,
    });

    return this.preparedRuntime;
  }

  async prepareGuestProfile(): Promise<PreparedProfileRuntime> {
    return await this.prepareProfile(GUEST_PROFILE_IDENTITY, {
      displayName: 'Guest',
      identifier: null,
    });
  }

  isGuestProfileIdentity(identityId: string | null | undefined): boolean {
    return identityId === GUEST_PROFILE_IDENTITY;
  }

  getActiveOrPreparedIdentityId(): string | null {
    return (
      this.activeRuntime?.descriptor.identityId ??
      this.preparedRuntime?.descriptor.identityId ??
      null
    );
  }

  /**
   * Upgrade the current guest profile to an online identity without moving local data.
   * 将当前访客 profile 升级为在线 identity，本地数据目录不搬家。
   *
   * Failure leaves the guest registry entry untouched when rebind throws before mutation completes.
   * 失败时若 rebind 抛错，访客注册表项保持不变。
   */
  async upgradeGuestProfileToOnlineIdentity(params: {
    onlineIdentityId: string;
    displayName?: string;
    identifier?: string | null;
    snapshotAccessToken?: string | null;
  }): Promise<PreparedProfileRuntime> {
    const guestIdentityId = GUEST_PROFILE_IDENTITY;
    const guestDescriptor = await this.profileRegistry.find(guestIdentityId);
    if (!guestDescriptor) {
      throw new Error('No guest profile exists to upgrade');
    }

    // If a prepared/active runtime is currently on guest, discard it first so we can
    // re-open under the rebound identity without holding stale auth context.
    // 若当前 prepared/active 是访客，先丢弃，以便用新 identity 重新打开。
    if (this.preparedRuntime?.descriptor.identityId === guestIdentityId) {
      await this.discardPreparedProfile();
    }
    if (this.activeRuntime?.descriptor.identityId === guestIdentityId) {
      await this.deactivateProfile();
    }

    await this.profileRegistry.rebindIdentityOwnership({
      fromIdentityId: guestIdentityId,
      toIdentityId: params.onlineIdentityId,
      displayName: params.displayName ?? guestDescriptor.displayName,
      identifier: params.identifier ?? guestDescriptor.identifier,
    });

    // prepareProfile will find the rebound registry entry by online identityId and
    // reuse the same profileId/directory (Vault stays put).
    return await this.prepareProfile(params.onlineIdentityId, {
      displayName: params.displayName ?? guestDescriptor.displayName,
      identifier: params.identifier ?? guestDescriptor.identifier,
      snapshotAccessToken: params.snapshotAccessToken,
    });
  }

  async activatePreparedProfile(options: { syncMode: 'online' | 'local' }): Promise<void> {
    if (!this.preparedRuntime) {
      throw new Error('No prepared profile is available for activation');
    }

    if (this.activationLock) {
      await this.activationLock;
      if (!this.preparedRuntime) {
        return;
      }
    }

    // Capture profileId before the IIFE clears preparedRuntime at line ~215,
    // so the catch block can safely reference it even if registry calls throw.
    const preparedProfileId = this.preparedRuntime.descriptor.profileId;

    const activationPromise = (async () => {
      if (this.activeRuntime) {
        await this.deactivateProfile();
      }

      const prepared = this.preparedRuntime!;

      if (options.syncMode === 'online') {
        await ensurePowerSyncSyncMode(this.tokenManager);
      }

      const bootstrapper = new ElectronBootstrapper(prepared.db);
      if (this.registerModules) {
        await this.registerModules(bootstrapper, prepared.db, prepared.profileResolver);
      }
      await bootstrapper.init(prepared.authContextProvider);

      this.activeRuntime = {
        ...prepared,
        bootstrapper,
      };
      this.preparedRuntime = null;

      await this.profileRegistry.setActiveProfile(prepared.descriptor.profileId);
      await this.profileRegistry.touch(prepared.descriptor.profileId);

      logger.info('Profile activated', {
        profileId: prepared.descriptor.profileId,
        identityId: prepared.descriptor.identityId,
        syncMode: options.syncMode,
      });
    })();

    this.activationLock = activationPromise;
    try {
      await activationPromise;
    } catch (error) {
      logger.error('Profile activation failed', { error });
      await this.profileRegistry
        .markError(preparedProfileId)
        .catch((registryError) =>
          logger.error('Failed to mark profile activation error', { error: registryError }),
        );
      // activeRuntime may have been assigned before the failure — clean it up too
      if (this.activeRuntime) {
        await this.deactivateProfile().catch((deactivateError) =>
          logger.error('Failed to deactivate partially activated profile', {
            error: deactivateError,
          }),
        );
      }
      await this.disposePreparedRuntime();
      throw error;
    } finally {
      this.activationLock = null;
    }
  }

  async discardPreparedProfile(): Promise<void> {
    await this.disposePreparedRuntime();
  }

  async deactivateProfile(): Promise<void> {
    if (!this.activeRuntime) {
      return;
    }

    const profileId = this.activeRuntime.descriptor.profileId;
    logger.info('Deactivating profile', { profileId });

    try {
      stopScheduleRuntime();
    } catch (error) {
      logger.warn('Failed to stop schedule runtime', { error });
    }

    try {
      await this.activeRuntime.bootstrapper.destroy();
    } catch (error) {
      logger.error('Error destroying profile bootstrapper', { error });
    }

    await this.teardownAuthResources();

    this.activeRuntime = null;

    try {
      await this.profileRegistry.setActiveProfile(null);
    } catch (error) {
      logger.error('Failed to clear active profile in registry', {
        error,
        previousProfileId: profileId,
      });
    }
  }

  async removeProfile(identityId: string): Promise<void> {
    const descriptor = await this.profileRegistry.find(identityId);
    if (!descriptor) {
      logger.warn('Profile not found for removal', { identityId });
      return;
    }

    if (descriptor.profileId === this.activeRuntime?.descriptor.profileId) {
      throw new Error('Cannot remove active profile. Deactivate first.');
    }

    if (descriptor.profileId === this.preparedRuntime?.descriptor.profileId) {
      await this.disposePreparedRuntime();
    }

    const profileResolver = createProfilePathResolver(
      this.sharedResolver.rootDir,
      descriptor.profileId,
    );

    try {
      await fs.promises.rm(profileResolver.profileDir, { recursive: true, force: true });
      logger.info('Profile directory deleted', { profileDir: profileResolver.profileDir });
    } catch (error) {
      logger.error('Failed to delete profile directory', { error });
      throw new Error(`Failed to delete profile directory: ${profileResolver.profileDir}`);
    }

    await this.profileRegistry.remove(descriptor.profileId);
    logger.info('Profile removed', { profileId: descriptor.profileId });
  }

  private async disposePreparedRuntime(): Promise<void> {
    if (!this.preparedRuntime) {
      return;
    }

    logger.info('Discarding prepared profile', {
      profileId: this.preparedRuntime.descriptor.profileId,
    });

    await this.teardownAuthResources();
    this.preparedRuntime = null;
  }

  private async hydrateProfileSnapshot(
    descriptor: ProfileDescriptor,
    profileResolver: ProfilePathResolver,
    accessToken?: string | null,
  ) {
    const result = await this.profileSnapshotService.hydrateIfNeeded({
      sharedResolver: this.sharedResolver,
      profileResolver,
      descriptor,
      accessToken,
    });

    if (result.metadata) {
      await this.profileRegistry.recordSnapshotHydration(descriptor.profileId, {
        version: result.metadata.version,
        hydratedAt: result.metadata.hydratedAt,
      });
    } else if (result.skippedReason === 'snapshot-unavailable') {
      await this.profileRegistry.clearSnapshotState(descriptor.profileId);
    }

    return result;
  }

  private async openProfileResources(profileResolver: ProfilePathResolver) {
    this.tokenManager.switchToProfile(profileResolver.tokensPath);

    const db = await openPowerSyncLocalOnly(profileResolver.dbPath);
    const authService = createDesktopProfileAuthService(
      db,
      this.tokenManager,
      this.rememberedAccountsService,
      this.networkStateManager,
      this.windowManager,
    );
    const authContextProvider = new DesktopAuthContextProvider(authService);
    this.onAuthServiceChanged?.(authService);

    await authService.configureAndActivateProfile(this.sharedResolver.authDir);

    return { db, authService, authContextProvider };
  }

  private async teardownAuthResources(): Promise<void> {
    const authService = this.activeRuntime?.authService ?? this.preparedRuntime?.authService;

    try {
      authService?.cleanupSessionManager();
    } catch (error) {
      logger.error('Failed to cleanup session manager', { error });
    }

    try {
      authService?.cleanup();
    } catch (error) {
      logger.error('Failed to cleanup auth service', { error });
    }

    try {
      await shutdownPowerSync();
    } catch (error) {
      logger.error('Failed to shutdown PowerSync', { error });
    }

    try {
      await this.tokenManager.clearForProfileSwitch();
    } catch (error) {
      logger.error('Failed to clear token manager', { error });
    }

    this.onAuthServiceChanged?.(null);
  }
}

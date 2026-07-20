import fs from 'node:fs';
import type { SharedPathResolver } from '../paths';
import { computeProfileId } from '../paths';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('ProfileRegistry');

export interface ProfileDescriptor {
  profileId: string;
  identityId: string;
  displayName: string;
  identifier: string | null;
  lastActiveAt: number;
  createdAt: number;
  hasSnapshot: boolean;
  lastSnapshotVersion: string | null;
  lastSnapshotHydratedAt: number | null;
  status: 'pending' | 'ready' | 'error';
}

interface RegistryFile {
  version: number;
  activeProfileId: string | null;
  profiles: ProfileDescriptor[];
}

const EMPTY_REGISTRY: RegistryFile = {
  version: 1,
  activeProfileId: null,
  profiles: [],
};

function normalizeProfileDescriptor(profile: Partial<ProfileDescriptor> & Pick<ProfileDescriptor, 'profileId' | 'identityId' | 'displayName' | 'lastActiveAt' | 'createdAt'>): ProfileDescriptor {
  return {
    profileId: profile.profileId,
    identityId: profile.identityId,
    displayName: profile.displayName,
    identifier: profile.identifier ?? null,
    lastActiveAt: profile.lastActiveAt,
    createdAt: profile.createdAt,
    hasSnapshot: profile.hasSnapshot ?? false,
    lastSnapshotVersion: profile.lastSnapshotVersion ?? null,
    lastSnapshotHydratedAt: profile.lastSnapshotHydratedAt ?? null,
    status: profile.status ?? 'ready',
  };
}

/**
 * Manages the profile registry at shared/profiles/registry.json.
 */
export class ProfileRegistry {
  private readonly registryPath: string;
  private readonly registryDir: string;
  private cached: RegistryFile | null = null;
  private loadPromise: Promise<RegistryFile> | null = null;

  constructor(private readonly sharedResolver: SharedPathResolver) {
    this.registryPath = sharedResolver.registryPath;
    this.registryDir = sharedResolver.profilesRegistryDir;
  }

  /**
   * Load and cache the registry file. Creates it if absent.
   * Concurrent calls await the same in-flight load to prevent races.
   */
  async load(): Promise<RegistryFile> {
    if (this.cached) return this.cached;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this.doLoad();

    try {
      return await this.loadPromise;
    } finally {
      this.loadPromise = null;
    }
  }

  private async doLoad(): Promise<RegistryFile> {
    try {
      const raw = await fs.promises.readFile(this.registryPath, 'utf-8');
      const parsed = JSON.parse(raw) as RegistryFile;
      this.cached = {
        version: parsed.version ?? EMPTY_REGISTRY.version,
        activeProfileId: parsed.activeProfileId ?? null,
        profiles: Array.isArray(parsed.profiles)
          ? parsed.profiles.map((profile) => normalizeProfileDescriptor(profile))
          : [],
      };
    } catch (err: unknown) {
      if (err instanceof SyntaxError) {
        // JSON is corrupt — backup and start fresh
        logger.error('Registry JSON is corrupt, backing up and resetting', { error: err });
        await this.backupCorruptFile();
      } else if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        // File doesn't exist — start fresh (expected on first run)
        logger.debug('Registry file not found, creating empty registry');
      } else {
        // Other errors (EPERM, EACCES, etc.) — re-throw to avoid overwriting valid data
        logger.error('Failed to read registry file', { error: err });
        throw err;
      }
      this.cached = { ...EMPTY_REGISTRY, profiles: [] };
      await this.save();
    }

    return this.cached!;
  }

  /**
   * Backup a corrupt registry file before resetting.
   */
  private async backupCorruptFile(): Promise<void> {
    try {
      const backupPath = `${this.registryPath}.corrupt.${Date.now()}`;
      await fs.promises.copyFile(this.registryPath, backupPath);
      logger.info('Corrupt registry backed up', { backupPath });
    } catch (err) {
      logger.warn('Failed to backup corrupt registry file', { error: err });
    }
  }

  /**
   * List all profiles sorted by lastActiveAt descending.
   */
  async list(): Promise<ProfileDescriptor[]> {
    const data = await this.load();
    return [...data.profiles]
      .map((profile) => normalizeProfileDescriptor(profile))
      .sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  }

  /**
   * Find a profile by identityId.
   */
  async find(identityId: string): Promise<ProfileDescriptor | null> {
    const data = await this.load();
    const profile = data.profiles.find((p) => p.identityId === identityId) ?? null;
    return profile ? normalizeProfileDescriptor(profile) : null;
  }

  /**
   * Rebind an existing profile directory/registry entry to a new online identity.
   * Keeps the same profileId so local Vault/data paths do not move (guest upgrade).
   * 将既有 profile 目录/注册表项重绑到新的在线 identity；保留 profileId，本地 Vault 不搬家。
   */
  async rebindIdentityOwnership(params: {
    fromIdentityId: string;
    toIdentityId: string;
    displayName?: string;
    identifier?: string | null;
  }): Promise<ProfileDescriptor> {
    const data = await this.load();
    const from = data.profiles.find((p) => p.identityId === params.fromIdentityId);
    if (!from) {
      throw new Error(`Profile not found for identity: ${params.fromIdentityId}`);
    }

    const conflict = data.profiles.find(
      (p) => p.identityId === params.toIdentityId && p.profileId !== from.profileId,
    );
    if (conflict) {
      throw new Error(
        `Target identity already owns another profile (${conflict.profileId}); refusing silent merge`,
      );
    }

    from.identityId = params.toIdentityId;
    if (params.displayName !== undefined) {
      from.displayName = params.displayName;
    }
    if (params.identifier !== undefined) {
      from.identifier = params.identifier?.trim().toLowerCase() || null;
    }
    from.lastActiveAt = Date.now();
    await this.save();

    logger.info('Profile identity ownership rebound', {
      profileId: from.profileId,
      fromIdentityId: params.fromIdentityId,
      toIdentityId: params.toIdentityId,
    });
    return normalizeProfileDescriptor(from);
  }

  async findByIdentifier(identifier: string): Promise<ProfileDescriptor | null> {
    const normalized = identifier.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    const data = await this.load();
    const profile =
      data.profiles.find((p) => p.identifier?.trim().toLowerCase() === normalized) ?? null;
    return profile ? normalizeProfileDescriptor(profile) : null;
  }

  /**
   * Register a new profile. If one already exists for this identityId, returns it.
   */
  async register(
    identityId: string,
    displayName: string,
    identifier?: string | null,
  ): Promise<ProfileDescriptor> {
    const data = await this.load();
    const normalizedIdentifier = identifier?.trim().toLowerCase() || null;

    const existing = data.profiles.find((p) => p.identityId === identityId);
    if (existing) {
      if (
        existing.displayName !== displayName ||
        (existing.identifier ?? null) !== normalizedIdentifier
      ) {
        existing.displayName = displayName;
        existing.identifier = normalizedIdentifier;
        await this.save();
      }
      return normalizeProfileDescriptor(existing);
    }

    const now = Date.now();
    const descriptor: ProfileDescriptor = {
      profileId: computeProfileId(identityId),
      identityId,
      displayName,
      identifier: normalizedIdentifier,
      lastActiveAt: now,
      createdAt: now,
      hasSnapshot: false,
      lastSnapshotVersion: null,
      lastSnapshotHydratedAt: null,
      status: 'pending',
    };

    data.profiles.push(descriptor);
    await this.save();

    logger.info('Profile registered', { profileId: descriptor.profileId, identityId });
    return normalizeProfileDescriptor(descriptor);
  }

  /**
   * Remove a profile entry from the registry.
   * Does NOT delete the profile directory — caller is responsible for that.
   */
  async remove(profileId: string): Promise<void> {
    const data = await this.load();
    const index = data.profiles.findIndex((p) => p.profileId === profileId);
    if (index === -1) return;

    data.profiles.splice(index, 1);

    if (data.activeProfileId === profileId) {
      data.activeProfileId = null;
    }

    await this.save();
    logger.info('Profile removed from registry', { profileId });
  }

  /**
   * Set the active profile ID. Validates that the profile exists.
   */
  async setActiveProfile(profileId: string | null): Promise<void> {
    const data = await this.load();

    if (profileId !== null) {
      const exists = data.profiles.some((p) => p.profileId === profileId);
      if (!exists) {
        throw new Error(`Profile not found: ${profileId}`);
      }
    }

    data.activeProfileId = profileId;
    await this.save();
  }

  /**
   * Get the active profile ID.
   */
  async getActiveProfileId(): Promise<string | null> {
    const data = await this.load();
    return data.activeProfileId;
  }

  /**
   * Update lastActiveAt for a profile.
   */
  async touch(profileId: string): Promise<void> {
    const data = await this.load();
    const profile = data.profiles.find((p) => p.profileId === profileId);
    if (!profile) return;

    profile.lastActiveAt = Date.now();
    await this.save();
  }

  async markReady(profileId: string): Promise<void> {
    await this.updateProfile(profileId, { status: 'ready' });
  }

  async markError(profileId: string): Promise<void> {
    await this.updateProfile(profileId, { status: 'error' });
  }

  async recordSnapshotHydration(
    profileId: string,
    snapshot: { version: string | null; hydratedAt?: number },
  ): Promise<void> {
    await this.updateProfile(profileId, {
      hasSnapshot: true,
      lastSnapshotVersion: snapshot.version,
      lastSnapshotHydratedAt: snapshot.hydratedAt ?? Date.now(),
    });
  }

  async clearSnapshotState(profileId: string): Promise<void> {
    await this.updateProfile(profileId, {
      hasSnapshot: false,
      lastSnapshotVersion: null,
      lastSnapshotHydratedAt: null,
    });
  }

  /**
   * Get the active profile descriptor, or null.
   */
  async getActiveProfile(): Promise<ProfileDescriptor | null> {
    const data = await this.load();
    if (!data.activeProfileId) return null;
    const profile = data.profiles.find((p) => p.profileId === data.activeProfileId) ?? null;
    return profile ? normalizeProfileDescriptor(profile) : null;
  }

  private async updateProfile(
    profileId: string,
    patch: Partial<ProfileDescriptor>,
  ): Promise<void> {
    const data = await this.load();
    const profile = data.profiles.find((entry) => entry.profileId === profileId);
    if (!profile) {
      return;
    }

    Object.assign(profile, patch);
    await this.save();
  }

  /**
   * Atomically persist the registry to disk.
   */
  private async save(): Promise<void> {
    if (!this.cached) return;

    await fs.promises.mkdir(this.registryDir, { recursive: true });

    const tmpPath = `${this.registryPath}.tmp`;
    const content = JSON.stringify(this.cached, null, 2);

    await fs.promises.writeFile(tmpPath, content, 'utf-8');
    await fs.promises.rename(tmpPath, this.registryPath);
  }
}

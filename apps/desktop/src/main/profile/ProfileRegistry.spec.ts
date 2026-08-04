import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SharedPathResolver } from '../paths';
import { ProfileRegistry } from './profile-registry';

function createSharedResolver(rootDir: string): SharedPathResolver {
  return {
    rootDir,
    sharedDir: path.join(rootDir, 'shared'),
    authDir: path.join(rootDir, 'shared', 'auth'),
    configDir: path.join(rootDir, 'shared', 'config'),
    uiDir: path.join(rootDir, 'shared', 'ui'),
    profilesRegistryDir: path.join(rootDir, 'shared', 'profiles'),
    deviceIdPath: path.join(rootDir, 'shared', 'auth', 'device-id'),
    runtimeConfigPath: path.join(rootDir, 'shared', 'config', 'desktop-runtime.json'),
    profileAccessWindowStatePath: path.join(rootDir, 'shared', 'ui', 'profile-access-window-state.json'),
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

describe('ProfileRegistry', () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'desktop-profile-registry-'));
  });

  afterEach(async () => {
    await fs.promises.rm(rootDir, { recursive: true, force: true });
  });

  it('tracks snapshot metadata and profile status', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));

    const descriptor = await registry.register('identity-1', 'Test User', 'test@example.com');
    expect(descriptor.status).toBe('pending');
    expect(descriptor.hasSnapshot).toBe(false);

    await registry.recordSnapshotHydration(descriptor.profileId, {
      version: '2026-05-18T00:00:00Z',
      hydratedAt: 123456,
    });
    await registry.markReady(descriptor.profileId);

    const reloaded = await registry.findByOwnerId('identity-1');
    expect(reloaded).not.toBeNull();
    expect(reloaded?.hasSnapshot).toBe(true);
    expect(reloaded?.lastSnapshotVersion).toBe('2026-05-18T00:00:00Z');
    expect(reloaded?.lastSnapshotHydratedAt).toBe(123456);
    expect(reloaded?.status).toBe('ready');
  });

  it('returns existing descriptor when registering the same identityId twice', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));

    const first = await registry.register('identity-1', 'Alice', 'alice@example.com');
    const second = await registry.register('identity-1', 'Alice Updated', 'alice@example.com');

    expect(second.profileId).toBe(first.profileId);
    expect(second.displayName).toBe('Alice Updated');
  });

  it('assigns different profileIds for different identityIds', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));

    const a = await registry.register('identity-a', 'Alice', 'alice@example.com');
    const b = await registry.register('identity-b', 'Bob', 'bob@example.com');

    expect(a.profileId).not.toBe(b.profileId);
  });

  it('lists profiles sorted by lastActiveAt descending', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));

    const a = await registry.register('identity-a', 'Alice');
    await registry.register('identity-b', 'Bob');
    await registry.touch(a.profileId);

    const list = await registry.list();
    expect(list.length).toBe(2);
    expect(list[0]!.localOwnerId).toBe('identity-a');
    expect(list[1]!.localOwnerId).toBe('identity-b');
  });

  it('removes a profile from registry and clears activeProfileId if it was active', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));

    const descriptor = await registry.register('identity-1', 'Alice');
    await registry.setActiveProfile(descriptor.profileId);
    expect(await registry.getActiveProfileId()).toBe(descriptor.profileId);

    await registry.remove(descriptor.profileId);

    expect(await registry.getActiveProfileId()).toBeNull();
    expect(await registry.findByOwnerId('identity-1')).toBeNull();
  });

  it('findByIdentifier performs case-insensitive lookup', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));

    await registry.register('identity-1', 'Alice', 'Alice@Example.com');

    const found = await registry.findByIdentifier('alice@example.com');
    expect(found).not.toBeNull();
    expect(found?.localOwnerId).toBe('identity-1');
  });

  it('findByIdentifier returns null for empty or whitespace-only input', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));

    await registry.register('identity-1', 'Alice', 'alice@example.com');

    expect(await registry.findByIdentifier('')).toBeNull();
    expect(await registry.findByIdentifier('   ')).toBeNull();
  });

  it('finds registered profiles by their cloud account binding', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));
    const registered = await registry.register('identity-1', 'Alice', 'alice@example.com');

    expect(await registry.findByCloudAccountId('identity-1')).toEqual(registered);
    expect(await registry.findByCloudAccountId('missing')).toBeNull();
  });

  it('markError sets profile status to error', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));

    const descriptor = await registry.register('identity-1', 'Alice');
    await registry.markError(descriptor.profileId);

    const found = await registry.findByOwnerId('identity-1');
    expect(found?.status).toBe('error');
  });

  it('clearSnapshotState resets snapshot fields', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));

    const descriptor = await registry.register('identity-1', 'Alice');
    await registry.recordSnapshotHydration(descriptor.profileId, {
      version: 'v1',
      hydratedAt: Date.now(),
    });

    let found = await registry.findByOwnerId('identity-1');
    expect(found?.hasSnapshot).toBe(true);

    await registry.clearSnapshotState(descriptor.profileId);
    found = await registry.findByOwnerId('identity-1');
    expect(found?.hasSnapshot).toBe(false);
    expect(found?.lastSnapshotVersion).toBeNull();
    expect(found?.lastSnapshotHydratedAt).toBeNull();
  });

  it('recovers from corrupt registry JSON by backing up and resetting', async () => {
    const resolver = createSharedResolver(rootDir);
    const registryDir = resolver.profilesRegistryDir;
    await fs.promises.mkdir(registryDir, { recursive: true });
    await fs.promises.writeFile(resolver.registryPath, '{invalid json!!!', 'utf8');

    const registry = new ProfileRegistry(resolver);
    const list = await registry.list();
    expect(list).toEqual([]);

    // Backup file should exist
    const files = await fs.promises.readdir(registryDir);
    const backupFiles = files.filter((f) => f.includes('.corrupt.'));
    expect(backupFiles.length).toBe(1);
  });

  it('creates registry file on first run when it does not exist', async () => {
    const resolver = createSharedResolver(rootDir);

    const registry = new ProfileRegistry(resolver);
    const list = await registry.list();
    expect(list).toEqual([]);

    expect(fs.existsSync(resolver.registryPath)).toBe(true);
  });

  it('setActiveProfile throws when profileId does not exist', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));

    await expect(registry.setActiveProfile('nonexistent')).rejects.toThrow(
      'Profile not found',
    );
  });

  it('getActiveProfile returns null when no profile is active', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));

    expect(await registry.getActiveProfile()).toBeNull();
  });

  it('register updates identifier when it changes for existing profile', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));

    const first = await registry.register('identity-1', 'Alice', 'alice@old.com');
    const updated = await registry.register('identity-1', 'Alice', 'alice@new.com');

    expect(updated.profileId).toBe(first.profileId);
    expect(updated.identifier).toBe('alice@new.com');
  });

  it('rebinds guest ownership to online identity without changing profileId', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));
    const guest = await registry.ensureGuest();
    const guestOwnerId = guest.localOwnerId;
    const rebound = await registry.rebindIdentityOwnership({
      fromOwnerId: guestOwnerId,
      toCloudAccountId: 'IdentityId_online_1',
      displayName: 'Online User',
      identifier: 'user@example.com',
    });

    expect(rebound.profileId).toBe(guest.profileId);
    expect(rebound.keyEnvelopeId).toBe(guest.keyEnvelopeId);
    expect(rebound.localOwnerId).toBe('IdentityId_online_1');
    expect(rebound.cloudBinding?.cloudAccountId).toBe('IdentityId_online_1');
    expect(rebound.displayName).toBe('Online User');
    expect(rebound.identifier).toBe('user@example.com');
    expect(await registry.findByOwnerId(guestOwnerId)).toBeNull();
    expect((await registry.findByOwnerId('IdentityId_online_1'))?.profileId).toBe(guest.profileId);
  });

  it('refuses rebind when target identity already owns another profile', async () => {
    const registry = new ProfileRegistry(createSharedResolver(rootDir));
    const guest = await registry.ensureGuest();
    await registry.register('IdentityId_online_1', 'Existing', 'user@example.com');

    await expect(
      registry.rebindIdentityOwnership({
        fromOwnerId: guest.localOwnerId,
        toCloudAccountId: 'IdentityId_online_1',
      }),
    ).rejects.toThrow(/refusing silent merge/);
  });

  it('creates one persistent random guest profile and reuses it after reload', async () => {
    const resolver = createSharedResolver(rootDir);
    const firstRegistry = new ProfileRegistry(resolver);
    const first = await firstRegistry.ensureGuest();

    const secondRegistry = new ProfileRegistry(resolver);
    const second = await secondRegistry.ensureGuest();

    expect(first.profileId).toBe(second.profileId);
    expect(first.localOwnerId).toBe(second.localOwnerId);
    expect(first.localOwnerId).toMatch(/^IdentityId_/);
    expect(first.avatarSeed).toBe(second.avatarSeed);
    expect(first.profileKind).toBe('guest');
    expect(first.cloudBinding).toBeNull();
    expect(first.displayName).toMatch(/^访客 \d{4}$/);
  });

  it('rejects legacy registry versions instead of silently migrating them', async () => {
    const resolver = createSharedResolver(rootDir);
    await fs.promises.mkdir(resolver.profilesRegistryDir, { recursive: true });
    await fs.promises.writeFile(resolver.registryPath, JSON.stringify({
      version: 1,
      activeProfileId: null,
      profiles: [],
    }));

    await expect(new ProfileRegistry(resolver).list()).rejects.toThrow(
      'Unsupported Profile registry version: 1',
    );
  });

});

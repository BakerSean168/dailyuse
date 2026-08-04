import path from 'node:path';
import type { SharedPathResolver } from './types';
import { resolveDesktopUserFilesPath } from '../user-data-path';

/**
 * Creates a SharedPathResolver from the application root directory.
 * Pure computation — does not create directories on disk.
 *
 * @param customUserFilesRoot - Optional override for the user-files root directory.
 *   When provided, takes precedence over the default Documents-based path.
 */
export function createSharedPathResolver(
  rootDir: string,
  customUserFilesRoot?: string,
): SharedPathResolver {
  const sharedDir = path.join(rootDir, 'shared');
  const authDir = path.join(sharedDir, 'auth');
  const configDir = path.join(sharedDir, 'config');
  const uiDir = path.join(sharedDir, 'ui');
  const profilesRegistryDir = path.join(sharedDir, 'profiles');
  const cacheDir = path.join(rootDir, 'cache');
  const userFilesRootDir = customUserFilesRoot ?? resolveDesktopUserFilesPath();

  return {
    rootDir,
    sharedDir,
    authDir,
    configDir,
    uiDir,
    profilesRegistryDir,

    deviceIdPath: path.join(authDir, 'device-id'),
    runtimeConfigPath: path.join(configDir, 'desktop-runtime.json'),
    profileAccessWindowStatePath: path.join(uiDir, 'profile-access-window-state.json'),
    registryPath: path.join(profilesRegistryDir, 'registry.json'),

    cacheDir,
    snapshotStagingDir: path.join(cacheDir, 'snapshot-staging'),
    downloadsDir: path.join(cacheDir, 'downloads'),
    tempDir: path.join(cacheDir, 'temp'),

    logsDir: path.join(rootDir, 'logs'),

    userFilesRootDir,
    userFilesExportsDir: path.join(userFilesRootDir, 'exports'),
    userFilesDownloadsDir: path.join(userFilesRootDir, 'downloads'),
    userFilesAttachmentsDir: path.join(userFilesRootDir, 'attachments'),
  };
}

import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { LoggerFactory, createLogger } from '@dailyuse/utils/logger';
import { WinstonLogger } from '@dailyuse/utils/winston';
import { configureDesktopUserDataPath, resolveDesktopUserFilesPath } from './user-data-path';
import { createSharedPathResolver, ensureSharedDirs } from './paths';
import { getCustomUserFilesRoot, setCustomUserFilesRoot } from './paths/user-files-config';
import type { SharedPathResolver } from './paths';

const configuredUserDataPath = configureDesktopUserDataPath();

// Read custom user-files path from config before creating resolver
const configDir = path.join(configuredUserDataPath, 'shared', 'config');
const customUserFilesRoot = getCustomUserFilesRoot(configDir);

// Create shared path resolver and ensure directories exist
let sharedResolver = createSharedPathResolver(configuredUserDataPath, customUserFilesRoot);
ensureSharedDirs(sharedResolver);

// Configure logging to the new logs directory
process.env.LOG_DIR = sharedResolver.logsDir;

fs.mkdirSync(sharedResolver.logsDir, { recursive: true });

LoggerFactory.registerProvider((context) => new WinstonLogger(context));
LoggerFactory.configure({ enableInProduction: true, level: 'info' });

const logger = createLogger('DesktopRuntime');

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception in Electron main process', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection in Electron main process', reason);
});

app.on('render-process-gone', (_event, _webContents, details) => {
  logger.error('Renderer process exited unexpectedly', details);
});

export function getConfiguredDesktopUserDataPath(): string {
  return configuredUserDataPath;
}

export function getSharedPathResolver(): SharedPathResolver {
  return sharedResolver;
}

/**
 * Updates the user-files root directory at runtime.
 * Writes the new path to config, rebuilds the shared path resolver,
 * and ensures the new directories exist.
 *
 * @param newRootPath - The new user-files root path, or null to reset to default.
 */
export function updateUserFilesRootPath(newRootPath: string | null): void {
  const current = sharedResolver.userFilesRootDir;
  const targetPath = newRootPath ?? resolveDesktopUserFilesPath();
  if (current === targetPath) return;

  setCustomUserFilesRoot(configDir, newRootPath);

  const resolvedPath = newRootPath ?? undefined;
  sharedResolver = createSharedPathResolver(configuredUserDataPath, resolvedPath);
  ensureSharedDirs(sharedResolver);
}

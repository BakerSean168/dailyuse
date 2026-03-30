import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export const DESKTOP_PRODUCT_NAME = 'DailyUse';

export const DESKTOP_USER_DATA_DIRS = Object.freeze({
  production: DESKTOP_PRODUCT_NAME,
  development: `${DESKTOP_PRODUCT_NAME}-Dev`,
  test: `${DESKTOP_PRODUCT_NAME}-Test`,
});

export type DesktopRuntimeChannel = keyof typeof DESKTOP_USER_DATA_DIRS;

function getDesktopRuntimeChannel(): DesktopRuntimeChannel {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    return 'test';
  }

  return app.isPackaged ? 'production' : 'development';
}

export function getDesktopUserDataDirName(
  channel: DesktopRuntimeChannel = getDesktopRuntimeChannel(),
): string {
  return DESKTOP_USER_DATA_DIRS[channel];
}

export function resolveDesktopUserDataPath(
  channel: DesktopRuntimeChannel = getDesktopRuntimeChannel(),
): string {
  return path.join(app.getPath('appData'), getDesktopUserDataDirName(channel));
}

export function configureDesktopUserDataPath(): string {
  const userDataPath = resolveDesktopUserDataPath();

  app.setName(DESKTOP_PRODUCT_NAME);
  app.setPath('userData', userDataPath);

  return userDataPath;
}

export function resolveDesktopDataPath(...segments: string[]): string {
  return path.join(app.getPath('userData'), 'data', ...segments);
}

export function ensureDesktopDataPath(...segments: string[]): string {
  // Desktop runtime data that should survive restarts lives under
  // `<userData>/data`. Callers append their own leaf directories such as
  // `logs`, while this helper guarantees the directory exists first.
  const targetPath = resolveDesktopDataPath(...segments);
  fs.mkdirSync(targetPath, { recursive: true });
  return targetPath;
}

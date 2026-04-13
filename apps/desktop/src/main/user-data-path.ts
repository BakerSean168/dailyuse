import { app } from 'electron';
import path from 'node:path';
import { DESKTOP_PRODUCT_NAME } from '@dailyuse/assets';

export const DESKTOP_USER_DATA_DIRS = Object.freeze({
  production: DESKTOP_PRODUCT_NAME,
  development: `${DESKTOP_PRODUCT_NAME}-Dev`,
  test: `${DESKTOP_PRODUCT_NAME}-Test`,
});

export type DesktopRuntimeChannel = keyof typeof DESKTOP_USER_DATA_DIRS;

function getExplicitDesktopUserDataPath(): string | null {
  const explicitPath = process.env.DAILYUSE_DESKTOP_USER_DATA_PATH?.trim();
  return explicitPath && explicitPath.length > 0 ? explicitPath : null;
}

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
  const explicitPath = getExplicitDesktopUserDataPath();
  if (explicitPath) {
    return explicitPath;
  }

  return path.join(app.getPath('appData'), getDesktopUserDataDirName(channel));
}

export function configureDesktopUserDataPath(): string {
  const userDataPath = resolveDesktopUserDataPath();

  app.setName(DESKTOP_PRODUCT_NAME);
  app.setPath('userData', userDataPath);

  return userDataPath;
}

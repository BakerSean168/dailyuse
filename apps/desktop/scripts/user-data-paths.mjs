import os from 'node:os';
import path from 'node:path';

const CANONICAL_USER_DATA_DIR_SEGMENTS = Object.freeze([
  ['Memoflow'],
  ['Memoflow-Dev'],
  ['Memoflow-Test'],
]);

const LEGACY_USER_DATA_DIR_SEGMENTS = Object.freeze([
  ['@dailyuse', 'desktop'],
  ['dailyuse-desktop'],
]);

function resolveAppDataRoot() {
  if (process.platform === 'win32') {
    return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  }

  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support');
  }

  return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
}

export function resolveLikelyUserDataDirs({ includeLegacy = true } = {}) {
  const appDataRoot = resolveAppDataRoot();
  const segmentGroups = includeLegacy
    ? [...CANONICAL_USER_DATA_DIR_SEGMENTS, ...LEGACY_USER_DATA_DIR_SEGMENTS]
    : [...CANONICAL_USER_DATA_DIR_SEGMENTS];

  return [...new Set(segmentGroups.map((segments) => path.join(appDataRoot, ...segments)))];
}

import { app } from 'electron';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ASSETS_PKG = '@dailyuse/assets';
const ASSETS_DIST = 'dist';

function getPackagedRoots(): string[] {
  return [
    path.join(process.resourcesPath, 'app.asar', 'node_modules', ASSETS_PKG, ASSETS_DIST),
    path.join(process.resourcesPath, 'app', 'node_modules', ASSETS_PKG, ASSETS_DIST),
    path.join(app.getAppPath(), 'node_modules', ASSETS_PKG, ASSETS_DIST),
  ];
}

function getDevRoots(): string[] {
  return [
    path.resolve(app.getAppPath(), '..', '..', 'packages', 'assets', ASSETS_DIST),
    path.resolve(app.getAppPath(), '..', 'packages', 'assets', ASSETS_DIST),
    path.resolve(process.cwd(), 'packages', 'assets', ASSETS_DIST),
  ];
}

export function resolveAssetPath(relativePath: string): string {
  const normalized = relativePath.replace(/^\/+/, '');
  const roots = app.isPackaged ? getPackagedRoots() : getDevRoots();
  const fallbackRoots = app.isPackaged ? getDevRoots() : getPackagedRoots();

  for (const root of roots) {
    const candidate = path.join(root, normalized);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  for (const root of fallbackRoots) {
    const candidate = path.join(root, normalized);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  const fallback = path.join(roots[0] ?? '', normalized);
  console.warn('[assets] Asset not found, using fallback path:', fallback);
  return fallback;
}

export function resolveAssetPathFromKey(
  type: 'images' | 'audio',
  key: string,
  manifest?: { images?: Record<string, string>; audio?: Record<string, string> },
): string | null {
  const group = type === 'images' ? manifest?.images : manifest?.audio;
  if (!group) {
    return null;
  }

  const assetPath = group[key];
  if (!assetPath) {
    return null;
  }

  return resolveAssetPath(assetPath.replace(/^\.\//, ''));
}

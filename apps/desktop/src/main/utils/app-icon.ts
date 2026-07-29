import { app, nativeImage, type NativeImage } from 'electron';
import { existsSync } from 'node:fs';
import { assetManifest } from '@memoflow/assets';
import { resolveAssetPath, resolveAssetPathFromKey } from './asset-path';

export const DESKTOP_APP_USER_MODEL_ID = 'com.memoflow.app';
export const DESKTOP_TRAY_GUID = 'f59bd2f2-1df9-417d-9f92-0ae864162818';

function resolveIconPath(key: keyof typeof assetManifest.images, fallbackPath: string): string {
  return resolveAssetPathFromKey('images', key, assetManifest) ?? resolveAssetPath(fallbackPath);
}

function shouldLogIconDiagnostics(): boolean {
  return !app.isPackaged || process.env.DEBUG_ICON_DIAGNOSTICS === 'true';
}

function logIconDiagnostics(label: string, iconPath: string, icon: NativeImage): void {
  if (!shouldLogIconDiagnostics()) {
    return;
  }

  const size = icon.getSize();
  console.info('[icons] Resolved native image', {
    label,
    iconPath,
    exists: existsSync(iconPath),
    empty: icon.isEmpty(),
    width: size.width,
    height: size.height,
    appPath: app.getAppPath(),
    execPath: process.execPath,
    isPackaged: app.isPackaged,
    platform: process.platform,
  });
}

function createInlineTrayFallback(size: number): NativeImage {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 ${size - 5} C${size * 0.28} ${size * 0.52}, ${size * 0.55} ${size * 0.58}, ${size - 2} 3" stroke="#F4AA24" stroke-width="${Math.max(2, size * 0.18)}"/>
        <path d="M${size * 0.34} ${size * 0.58} C${size * 0.42} ${size * 0.88}, ${size * 0.66} ${size * 0.88}, ${size * 0.82} ${size * 0.48}" stroke="#FFF4D6" stroke-width="${Math.max(1.4, size * 0.1)}"/>
      </g>
      <circle cx="${size * 0.42}" cy="${size * 0.62}" r="${Math.max(1.4, size * 0.08)}" fill="#FFF7E3"/>
    </svg>
  `.trim();
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return nativeImage.createFromDataURL(dataUrl);
}

function loadNativeImage(label: string, candidates: string[], fallbackSize: number): NativeImage {
  for (const iconPath of candidates) {
    if (!iconPath || !existsSync(iconPath)) {
      if (shouldLogIconDiagnostics()) {
        console.warn('[icons] Missing icon candidate', { label, iconPath });
      }
      continue;
    }

    const icon = nativeImage.createFromPath(iconPath);
    logIconDiagnostics(label, iconPath, icon);

    if (!icon.isEmpty()) {
      return icon;
    }
  }

  const fallback = createInlineTrayFallback(fallbackSize);
  console.warn('[icons] Falling back to inline generated tray icon', {
    label,
    fallbackSize,
  });
  return fallback;
}

export function configureDesktopShellIdentity(): void {
  if (process.platform === 'win32') {
    app.setAppUserModelId(DESKTOP_APP_USER_MODEL_ID);
  }
}

export function resolveWindowIconPath(): string {
  const iconPath =
    process.platform === 'win32'
      ? resolveIconPath('logoIco', 'images/logos/MemoFlow.ico')
      : resolveIconPath('logo512', 'images/logos/MemoFlow-512.png');

  if (shouldLogIconDiagnostics()) {
    console.info('[icons] Resolved window icon path', {
      iconPath,
      exists: existsSync(iconPath),
      isPackaged: app.isPackaged,
      platform: process.platform,
    });
  }

  return iconPath;
}

export function createTrayIconImage(): NativeImage {
  if (process.platform === 'win32') {
    const icon = loadNativeImage(
      'tray',
      [
        resolveIconPath('logoIco', 'images/logos/MemoFlow.ico'),
        resolveIconPath('trayWin32', 'images/logos/MemoFlow-Tray-Windows-32.png'),
        resolveIconPath('trayWin16', 'images/logos/MemoFlow-Tray-Windows-16.png'),
        resolveIconPath('logo32', 'images/logos/MemoFlow-32.png'),
      ],
      32,
    );
    return icon;
  }

  const icon = loadNativeImage(
    'tray',
    [resolveIconPath('logo32', 'images/logos/MemoFlow-32.png')],
    process.platform === 'darwin' ? 18 : 24,
  );

  if (process.platform === 'darwin') {
    return icon.resize({ width: 18, height: 18 });
  }

  return icon.resize({ width: 24, height: 24 });
}

export function resolveTrayIcon(): { image: NativeImage | string; guid?: string } {
  if (process.platform === 'win32') {
    const icoPath = resolveIconPath('logoIco', 'images/logos/MemoFlow.ico');

    if (shouldLogIconDiagnostics()) {
      console.info('[icons] Resolved tray icon path', {
        iconPath: icoPath,
        exists: existsSync(icoPath),
        isPackaged: app.isPackaged,
        platform: process.platform,
      });
    }

    if (existsSync(icoPath)) {
      return {
        image: icoPath,
        guid: DESKTOP_TRAY_GUID,
      };
    }
  }

  return {
    image: createTrayIconImage(),
  };
}

const DEFAULT_DESKTOP_DEV_SERVER_URL = 'http://localhost:5173';

export function getDesktopDevServerUrl(): string | null {
  const value = process.env.VITE_DEV_SERVER_URL?.trim();
  return value ? value : null;
}

export function getDesktopDevServerUrlOrDefault(): string {
  return getDesktopDevServerUrl() ?? DEFAULT_DESKTOP_DEV_SERVER_URL;
}

export function usesDesktopViteDevServer(): boolean {
  return getDesktopDevServerUrl() !== null;
}

export function isDesktopDevelopmentRuntime(): boolean {
  return usesDesktopViteDevServer() || process.env.NODE_ENV === 'development';
}

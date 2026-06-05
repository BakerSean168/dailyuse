const DEFAULT_DESKTOP_DEV_SERVER_PORT = 5173;

function getDesktopDevServerPort(): number {
  const value = Number(process.env.VITE_DEV_PORT);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_DESKTOP_DEV_SERVER_PORT;
}

export function getDesktopDevServerUrl(): string | null {
  const value = process.env.VITE_DEV_SERVER_URL?.trim();
  return value ? value : null;
}

export function getDesktopDevServerUrlOrDefault(): string {
  return getDesktopDevServerUrl() ?? `http://localhost:${getDesktopDevServerPort()}`;
}

export function usesDesktopViteDevServer(): boolean {
  return getDesktopDevServerUrl() !== null;
}

export function isDesktopDevelopmentRuntime(): boolean {
  return usesDesktopViteDevServer() || process.env.NODE_ENV === 'development';
}

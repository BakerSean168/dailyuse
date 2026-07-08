export const DEFAULT_REPOSITORY_STORAGE_BASE_DIR = '/tmp/dailyuse-repository-storage';

export interface ResolveRepositoryStorageBaseDirOptions {
  readonly storageBaseDir?: string | null;
  readonly env?: Record<string, string | undefined>;
}

function normalizePath(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveRepositoryStorageBaseDir(
  options: ResolveRepositoryStorageBaseDirOptions = {},
): string {
  const explicitPath = normalizePath(options.storageBaseDir);
  if (explicitPath) {
    return explicitPath;
  }

  const env = options.env ?? process.env;
  return (
    normalizePath(env.REPOSITORY_STORAGE_PATH) ??
    DEFAULT_REPOSITORY_STORAGE_BASE_DIR
  );
}

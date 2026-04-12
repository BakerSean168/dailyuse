export const electronNativeModules = ['electron', 'argon2', 'better-sqlite3'];

export const electronNativeRuntimePackages = ['argon2', 'better-sqlite3'];

export const electronJsExternalPackages = [
  '@powersync/node',
  '@powersync/common',
  'date-fns',
  'gray-matter',
];

export const electronExternalWorkspacePackages = ['@dailyuse/database'];

export const powerSyncRuntimePackages = [
  '@powersync/node',
  '@powersync/common',
  'async-mutex',
  'bson',
  'comlink',
  'event-iterator',
  'undici',
];

export const nativeLoaderRuntimePackages = ['bindings', 'file-uri-to-path'];

export const bundledDatabaseSubpaths = [
  '@dailyuse/database/powersync',
  '@dailyuse/database/dashboard-schema',
];

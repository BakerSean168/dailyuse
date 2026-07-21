/**
 * Dependency Injection (DI) Module
 *
 * Re-exports the lazy-module diagnostics helpers still used by system IPC.
 * Module wiring is owned by ElectronBootstrapper + per-package electron-entry.
 *
 * @module di
 */

export {
  ensureModuleLoaded,
  isModuleLoaded,
  getLoadedModules,
  getLazyModuleStats,
  getModuleLoadTimes,
} from './lazy-module-loader';

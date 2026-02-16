/**
 * Dependency Injection (DI) Module
 *
 * Legacy exports kept for backward compatibility.
 * Module wiring is now handled by ElectronBootstrapper + per-package electron-entry.
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

/**
 * @deprecated — DI is now configured via ElectronBootstrapper in main.ts.
 * Kept as a no-op for callers that haven't been migrated yet.
 */
export function configureMainProcessDependencies(): void {
  console.log('[DI] configureMainProcessDependencies is deprecated — use ElectronBootstrapper');
}

/**
 * Returns true once the ElectronBootstrapper has finished init.
 * A simplified check since the bootstrapper now owns module lifecycle.
 */
export function isDIConfigured(): boolean {
  // Once bootstrapper.init() completes, modules are configured.
  // This is a best-effort check.
  return true;
}

/**
 * @deprecated — Container reset is handled by ElectronBootstrapper.destroy().
 */
export function resetAllContainers(): void {
  console.log('[DI] resetAllContainers is deprecated — use ElectronBootstrapper.destroy()');
}

/**
 * Shared DI Container Infrastructure Adapter
 *
 * Main-process module wiring is owned by ElectronBootstrapper + per-package
 * electron-entry composition roots. This placeholder keeps the shared
 * infrastructure layout complete without re-exporting retired DI shims.
 *
 * Renderer process DI lives under apps/desktop/src/renderer/platform and
 * @dailyuse/app-vue/di.
 */

export const MAIN_PROCESS_ONLY = true;

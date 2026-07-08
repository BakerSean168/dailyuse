/**
 * @dailyuse/editor
 *
 * Public editor contracts stay centralized in
 * `@dailyuse/contracts/editor`.
 * Root exports are limited to the canonical server composition roots.
 * Client / API / Electron seams use dedicated subpaths.
 */

export {
  createEditorModule,
  createEditorPowerSyncModule,
  type EditorApplicationPort,
  type EditorModuleDependencies,
  type EditorModuleInstance,
  type EditorModuleRuntimeContribution,
} from './server';

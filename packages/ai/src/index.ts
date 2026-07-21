/**
 * @dailyuse/ai
 *
 * AI module runtime root.
 *
 * Public AI contracts are centralized in `@dailyuse/contracts/ai`.
 * Root exports are limited to the canonical server composition roots.
 * Client / API / Electron seams use dedicated subpaths.
 */

export {
  createAIModule,
  createAIPowerSyncModule,
  type AIModuleDependencies,
  type AIModuleInstance,
  type AIModuleServices,
  type AIApplicationPort,
  type AIModuleRuntimeContribution,
  type AIRuntimeContributionsInput,
  type AIModulePowerSyncOptions,
} from './server';

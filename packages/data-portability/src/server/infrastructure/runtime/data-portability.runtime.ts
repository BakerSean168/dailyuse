import type { DataPortabilityModuleRuntimeContribution } from '../data-portability.module';

/**
 * No-op runtime contribution kept for server-first composition symmetry.
 */
export function createDataPortabilityRuntimeContribution(): DataPortabilityModuleRuntimeContribution {
  return {
    start(): void {},
    stop(): void {},
  };
}

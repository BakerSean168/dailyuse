import type { DataPortabilityModuleRuntimeContribution } from '../data-portability.module';

export type DataPortabilityRuntimeContribution = DataPortabilityModuleRuntimeContribution;

/**
 * No-op runtime contribution kept for server-first composition symmetry.
 */
export function createDataPortabilityRuntimeContribution(): DataPortabilityRuntimeContribution {
  return {
    start(): void {},
    stop(): void {},
  };
}

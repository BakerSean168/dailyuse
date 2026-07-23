/**
 * Residual 987: sole runtime-contribution normalize helpers for task module entrypoints.
 * API module + Electron entry import these; local duals retired.
 * Soft residual: server composition-root task.module.ts keeps a local normalizeRuntimeContributions
 * (same shape via TaskRuntimeContributionsInput) to avoid circular import with this module's type host.
 */

import type { TaskModuleRuntimeContribution } from './task.module';

export function isRuntimeContributionArray(
  runtimeContributions:
    | TaskModuleRuntimeContribution
    | readonly TaskModuleRuntimeContribution[],
): runtimeContributions is readonly TaskModuleRuntimeContribution[] {
  return Array.isArray(runtimeContributions);
}

export function normalizeRuntimeContributions(
  runtimeContributions?:
    | TaskModuleRuntimeContribution
    | readonly TaskModuleRuntimeContribution[],
): readonly TaskModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  if (isRuntimeContributionArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }

  return [runtimeContributions];
}

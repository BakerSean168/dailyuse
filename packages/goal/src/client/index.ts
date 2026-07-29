/**
 * Goal client seam.
 *
 * Public goal contracts stay centralized in
 * `@memoflow/contracts/goal`.
 * Callers depend on this seam instead of the old application-client /
 * infrastructure-client layered exports.
 */

import type { IResultHttpClient } from '@memoflow/http-client';
import {
  BUILT_IN_RULES,
  BUILT_IN_TEMPLATES,
  GoalClientService,
  RULE_TEMPLATES,
  createGoalClientService,
  createGoalServiceFromHttpClient,
  findRuleById,
  getEnabledRules,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByIndustry,
  getTemplatesByRole,
  sortRulesByPriority,
  type GoalClientPort,
  type GoalTemplate,
  type KeyResultTemplate,
} from '../application-client';
import { Goal, GoalFolder, GoalRecord, GoalReview, KeyResult } from '../domain-client';
import {
  GoalFocusHttpAdapter,
  GoalFolderHttpAdapter,
  GoalHttpAdapter,
  createGoalHttpAdapters,
  type GoalHttpAdapters,
} from '../infrastructure-client/adapters/http';
import {
  GoalFocusIpcAdapter,
  GoalFolderIpcAdapter,
  GoalIpcAdapter,
  createGoalIpcAdapters,
  type GoalIpcAdapters,
} from '../infrastructure-client/adapters/ipc';
import type {
  IGoalApiClient,
  IGoalFocusApiClient,
  IGoalFolderApiClient,
  IResultIpcClient,
} from '../infrastructure-client/adapters/types';

export type {
  GoalClientPort,
  GoalHttpAdapters,
  GoalIpcAdapters,
  GoalTemplate,
  IGoalApiClient,
  IGoalFocusApiClient,
  IGoalFolderApiClient,
  IResultHttpClient,
  IResultIpcClient,
  KeyResultTemplate,
};

export function createGoalHttpClient(httpClient: IResultHttpClient): GoalClientPort {
  return createGoalServiceFromHttpClient(httpClient);
}

export function createGoalIpcClient(ipcClient: IResultIpcClient): GoalClientPort {
  const adapters = createGoalIpcAdapters(ipcClient);
  return createGoalClientService(adapters.goal, adapters.folder, adapters.focus);
}

export {
  BUILT_IN_RULES,
  BUILT_IN_TEMPLATES,
  Goal,
  GoalClientService,
  GoalFocusHttpAdapter,
  GoalFocusIpcAdapter,
  GoalFolder,
  GoalFolderHttpAdapter,
  GoalFolderIpcAdapter,
  GoalHttpAdapter,
  GoalIpcAdapter,
  GoalRecord,
  GoalReview,
  KeyResult,
  RULE_TEMPLATES,
  createGoalClientService,
  createGoalHttpAdapters,
  createGoalIpcAdapters,
  findRuleById,
  getEnabledRules,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByIndustry,
  getTemplatesByRole,
  sortRulesByPriority,
};

/**
 * Goal transport handler mapping.
 * 目标模块传输层处理器映射。
 *
 * This file converts the module's transport-neutral `GoalApplicationPort` into
 * the function signatures required by controllers. It is shared by HTTP and
 * Electron transports so the mapping is defined once.
 *
 * 这个文件把模块的传输层无关 `GoalApplicationPort` 转换成控制器所需的函数签名。
 * HTTP 和 Electron 共用这一层，避免重复定义同样的 handler 映射。
 */

import type { GoalUseCases } from '../controllers/goal.controller';
import type { GoalFolderUseCases } from '../controllers/goal-folder.controller';
import type { GoalApplicationPort } from '../infrastructure-server';

/**
 * Map GoalApplicationPort to GoalUseCases (controller port).
 * 将 GoalApplicationPort 映射为 GoalUseCases（控制器端口）。
 *
 * GoalApplicationPort already exposes plain functions, so this is a thin
 * regrouping layer instead of a wrapper factory.
 * GoalApplicationPort 已经暴露普通函数，因此这里是轻量分组，而不是包装层。
 */
export function createGoalTransportHandlers(api: GoalApplicationPort): GoalUseCases {
  return {
    createGoal: api.createGoal,
    getGoal: api.getGoal,
    listGoals: api.listGoals,
    updateGoal: api.updateGoal,
    deleteGoal: api.deleteGoal,
    archiveExpiredGoals: api.archiveExpiredGoals,
    archiveGoal: api.archiveGoal,
    activateGoal: api.activateGoal,
    completeGoal: api.completeGoal,
    searchGoals: api.searchGoals,
    addKeyResult: api.addKeyResult,
    updateKeyResult: api.updateKeyResult,
    updateKeyResultProgress: api.updateKeyResultProgress,
    deleteKeyResult: api.deleteKeyResult,
    addReview: api.addReview,
    listReviews: api.listReviews,
    updateReview: api.updateReview,
    deleteReview: api.deleteReview,
    createRecord: api.createRecord,
    listRecords: api.listRecords,
    deleteRecord: api.deleteRecord,
    getCurrentFocusMode: api.getCurrentFocusMode,
    activateFocusMode: api.activateFocusMode,
    deactivateFocusMode: api.deactivateFocusMode,
    extendFocusMode: api.extendFocusMode,
    getGoalAggregate: api.getGoalAggregate,
    getGoalProgressBreakdown: api.getGoalProgressBreakdown,
    cloneGoal: api.cloneGoal,
    batchUpdateKeyResultWeights: api.batchUpdateKeyResultWeights,
  };
}

/**
 * Map GoalApplicationPort to GoalFolderUseCases (controller port).
 * 将 GoalApplicationPort 映射为 GoalFolderUseCases（控制器端口）。
 */
export function createGoalFolderTransportHandlers(api: GoalApplicationPort): GoalFolderUseCases {
  return {
    createGoalFolder: api.createGoalFolder,
    getGoalFolder: api.getGoalFolder,
    listGoalFolders: api.listGoalFolders,
    updateGoalFolder: api.updateGoalFolder,
    deleteGoalFolder: api.deleteGoalFolder,
  };
}

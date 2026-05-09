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
 * Controllers expect use-case objects with `.execute(...)` methods.
 * GoalApplicationPort exposes plain functions, so we wrap each into an
 * object with `execute` to satisfy the structural contract.
 * 控制器期望带有 `.execute(...)` 方法的用例对象。
 * GoalApplicationPort 暴露的是普通函数，因此我们将每个函数包装为
 * 带有 `execute` 的对象以满足结构约定。
 */
export function createGoalTransportHandlers(api: GoalApplicationPort): GoalUseCases {
  return {
    createGoal: { execute: api.createGoal } as GoalUseCases['createGoal'],
    getGoal: { execute: api.getGoal } as GoalUseCases['getGoal'],
    listGoals: { execute: api.listGoals } as GoalUseCases['listGoals'],
    updateGoal: { execute: api.updateGoal } as GoalUseCases['updateGoal'],
    deleteGoal: { execute: api.deleteGoal } as GoalUseCases['deleteGoal'],
    archiveExpiredGoals: {
      execute: api.archiveExpiredGoals,
    } as GoalUseCases['archiveExpiredGoals'],
    archiveGoal: { execute: api.archiveGoal } as GoalUseCases['archiveGoal'],
    activateGoal: { execute: api.activateGoal } as GoalUseCases['activateGoal'],
    completeGoal: { execute: api.completeGoal } as GoalUseCases['completeGoal'],
    searchGoals: { execute: api.searchGoals } as GoalUseCases['searchGoals'],
    addKeyResult: { execute: api.addKeyResult } as GoalUseCases['addKeyResult'],
    updateKeyResult: { execute: api.updateKeyResult } as GoalUseCases['updateKeyResult'],
    updateKeyResultProgress: {
      execute: api.updateKeyResultProgress,
    } as GoalUseCases['updateKeyResultProgress'],
    deleteKeyResult: { execute: api.deleteKeyResult } as GoalUseCases['deleteKeyResult'],
    addReview: { execute: api.addReview } as GoalUseCases['addReview'],
    listReviews: { execute: api.listReviews } as GoalUseCases['listReviews'],
    updateReview: { execute: api.updateReview } as GoalUseCases['updateReview'],
    deleteReview: { execute: api.deleteReview } as GoalUseCases['deleteReview'],
    createRecord: { execute: api.createRecord } as GoalUseCases['createRecord'],
    listRecords: { execute: api.listRecords } as GoalUseCases['listRecords'],
    deleteRecord: { execute: api.deleteRecord } as GoalUseCases['deleteRecord'],
    getCurrentFocusMode: {
      execute: api.getCurrentFocusMode,
    } as GoalUseCases['getCurrentFocusMode'],
    activateFocusMode: { execute: api.activateFocusMode } as GoalUseCases['activateFocusMode'],
    deactivateFocusMode: {
      execute: api.deactivateFocusMode,
    } as GoalUseCases['deactivateFocusMode'],
    extendFocusMode: { execute: api.extendFocusMode } as GoalUseCases['extendFocusMode'],
    getGoalAggregate: { execute: api.getGoalAggregate } as GoalUseCases['getGoalAggregate'],
    getGoalProgressBreakdown: {
      execute: api.getGoalProgressBreakdown,
    } as GoalUseCases['getGoalProgressBreakdown'],
    cloneGoal: { execute: api.cloneGoal } as GoalUseCases['cloneGoal'],
    batchUpdateKeyResultWeights: {
      execute: api.batchUpdateKeyResultWeights,
    } as GoalUseCases['batchUpdateKeyResultWeights'],
  };
}

/**
 * Map GoalApplicationPort to GoalFolderUseCases (controller port).
 * 将 GoalApplicationPort 映射为 GoalFolderUseCases（控制器端口）。
 */
export function createGoalFolderTransportHandlers(api: GoalApplicationPort): GoalFolderUseCases {
  return {
    createGoalFolder: { execute: api.createGoalFolder } as GoalFolderUseCases['createGoalFolder'],
    getGoalFolder: { execute: api.getGoalFolder } as GoalFolderUseCases['getGoalFolder'],
    listGoalFolders: { execute: api.listGoalFolders } as GoalFolderUseCases['listGoalFolders'],
    updateGoalFolder: { execute: api.updateGoalFolder } as GoalFolderUseCases['updateGoalFolder'],
    deleteGoalFolder: { execute: api.deleteGoalFolder } as GoalFolderUseCases['deleteGoalFolder'],
  };
}

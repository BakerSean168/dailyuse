/**
 * 按照 DDD 业务拆分的应用服务导出
 * 
 * 每个服务对应一个明确的业务领域，职责单一
 */

export { GoalApplicationService } from './GoalApplicationService';
export { GoalKeyResultApplicationService } from './GoalKeyResultApplicationService';
export { GoalRecordApplicationService } from './GoalRecordApplicationService';
export { GoalReviewApplicationService } from './GoalReviewApplicationService';
export { GoalFolderApplicationService } from './GoalFolderApplicationService';
export { GoalStatisticsApplicationService } from './GoalStatisticsApplicationService';
export { FocusModeApplicationService } from './FocusModeApplicationService';
export { FocusSessionApplicationService } from './FocusSessionApplicationService';
export { WeightSnapshotApplicationService } from './WeightSnapshotApplicationService';
export { GoalEventPublisher } from './GoalEventPublisher';
export { GoalTaskEventHandlers } from './event-handlers/GoalTaskEventHandlers';

// Errors
export { GoalNotFoundError, KeyResultNotFoundError } from './errors/WeightSnapshotErrors';

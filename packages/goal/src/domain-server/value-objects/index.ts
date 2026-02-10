/**
 * Goal Module Value Objects - Domain Server
 * 
 * 从 @dailyuse/domain-shared 重新导出值对象
 * 并导出领域服务器特有的错误类
 */

// ============ 从 domain-shared 重新导出 ============

// IDs
export {
  GoalId,
  GoalFolderId,
  KeyResultId,
  GoalRecordId,
  FocusSessionId,
  GoalReviewId,
  KeyResultWeightSnapshotId,
} from '@/domain-shared';

// Value Objects (Enums & Types)
export {
  GoalStatus,
  KeyResultValueType,
  KeyResultCalculationMethod,
  ReminderTriggerType,
  ReviewType,
  FolderType,
  FocusSessionStatus,
  HiddenGoalsMode,
} from '@/domain-shared';

// Value Objects (Class Implementations)
export {
  GoalMetadata,
  GoalReminderConfig,
  GoalTimeRange,
  KeyResultProgress,
  KeyResultSnapshot,
  KeyResultWeightSnapshot,
} from '@/domain-shared';

// ============ 领域服务器特有的值对象 ============
export { FocusMode } from './focus-mode';

// ============ 领域服务器特有的错误类 ============
export {
  GoalNameRequiredError,
  GoalInvalidDateRangeError,
  GoalInvalidDateModificationError,
  GoalTargetDateNotSetError,
  GoalKeyResultNotFoundError,
  GoalReviewNotFoundError,
  KeyResultNotFoundInGoalError,
  GoalDeletedError,
  GoalArchivedError,
  GoalNameTooLongError,
  KeyResultWeightInvalidError,
  KeyResultWeightExceededError,
  GoalReviewRatingInvalidError,
} from './errors';

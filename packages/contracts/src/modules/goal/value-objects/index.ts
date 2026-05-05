/**
 * Goal Value Objects Export
 * 目标值对象导出
 */

export type { GoalMetadata, GoalMetadataDTO } from './goal-metadata';

export type { GoalId } from './goal-id';
export type { GoalFolderId } from './goal-folder-id';
export type { KeyResultId } from './key-result-id';
export type { FocusSessionId } from './focus-session-id';

export type {
  GoalTimeRange,
  GoalTimeRangeDTO,
} from './goal-time-range';

export type {
  KeyResultProgress,
  KeyResultProgressDTO,
} from './key-result-progress';

export type {
  KeyResultSnapshot,
  KeyResultSnapshotDTO,
} from './key-result-snapshot';

export type {
  ReminderTrigger,
  GoalReminderConfig,
  GoalReminderConfigDTO,
} from './goal-reminder-config';

export { SnapshotTrigger } from './key-result-weight-snapshot';
export type {
  KeyResultWeightSnapshot,
  KeyResultWeightSnapshotDTO,
} from './key-result-weight-snapshot';

export type { ProgressBreakdown, ProgressBreakdownResponse } from './progress-breakdown';

export { HiddenGoalsMode } from './focus-mode';
export type {
  FocusMode,
  FocusModeDTO,
  ActivateFocusModeRequest,
  ActivateFocusModeReq,
  ExtendFocusModeRequest,
  ExtendFocusModeReq,
  DeactivateFocusModeReq,
} from './focus-mode';
export {
  ActivateFocusModeSchema,
  DeactivateFocusModeSchema,
  ExtendFocusModeSchema,
} from './focus-mode';

// ============ 枚举值对象 ============
export { GoalStatus } from './goal-status';

export { GoalSystemView } from './goal-system-view';

export { KeyResultValueType } from './key-result-value-type';

export { KeyResultCalculationMethod } from './key-result-calculation-method';

export { ReminderTriggerType } from './reminder-trigger-type';

export { ReviewType } from './review-type';

export { FolderType } from './folder-type';

export { FocusSessionStatus } from './focus-session-status';

/**
 * Goal Value Objects Export
 * 目标值对象导出
 */

export type {
  GoalMetadata,
  GoalMetadataDTO,
  GoalMetadataPersistenceDTO,
} from './goal-metadata';

export type {
  GoalTimeRange,
  GoalTimeRangeDTO,
  GoalTimeRangePersistenceDTO,
} from './goal-time-range';

export type {
  KeyResultProgress,
  KeyResultProgressDTO,
  KeyResultProgressPersistenceDTO,
} from './key-result-progress';

export type {
  KeyResultSnapshot,
  KeyResultSnapshotDTO,
  KeyResultSnapshotPersistenceDTO,
} from './key-result-snapshot';

export type {
  ReminderTrigger,
  GoalReminderConfig,
  GoalReminderConfigDTO,
  GoalReminderConfigPersistenceDTO,
} from './goal-reminder-config';

export { SnapshotTrigger } from './key-result-weight-snapshot';
export type {
  SnapshotTrigger as SnapshotTriggerType,
  KeyResultWeightSnapshot,
  KeyResultWeightSnapshotDTO,
  KeyResultWeightSnapshotPersistenceDTO,
} from './key-result-weight-snapshot';

export type {
  ProgressBreakdown,
  ProgressBreakdownResponse,
} from './progress-breakdown';

export { HiddenGoalsMode } from './focus-mode';
export type {
  HiddenGoalsMode as HiddenGoalsModeType,
  FocusMode,
  FocusModeDTO,
  FocusModeClientDTO,
  FocusModePersistenceDTO,
  ActivateFocusModeRequest,
  ExtendFocusModeRequest,
} from './focus-mode';

// ============ 枚举值对象 ============
export { GoalStatus } from './goal-status';
export type { GoalStatus as GoalStatusType } from './goal-status';

export { KeyResultValueType } from './key-result-value-type';
export type { KeyResultValueType as KeyResultValueTypeType } from './key-result-value-type';

export { KeyResultCalculationMethod } from './key-result-calculation-method';
export type { KeyResultCalculationMethod as KeyResultCalculationMethodType } from './key-result-calculation-method';

export { ReminderTriggerType } from './reminder-trigger-type';
export type { ReminderTriggerType as ReminderTriggerTypeType } from './reminder-trigger-type';

export { ReviewType } from './review-type';
export type { ReviewType as ReviewTypeType } from './review-type';

export { FolderType } from './folder-type';
export type { FolderType as FolderTypeType } from './folder-type';

export { FocusSessionStatus } from './focus-session-status';
export type { FocusSessionStatus as FocusSessionStatusType } from './focus-session-status';

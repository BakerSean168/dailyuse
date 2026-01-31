/**
 * Goal Value Objects Export
 * 目标值对象导出
 */

export type {
  GoalMetadata,
  GoalMetadataDTO,
  GoalMetadataClientDTO,
  GoalMetadataPersistenceDTO,
  GoalMetadataServer,
  GoalMetadataClient,
  GoalMetadataServerDTO,
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
  GoalReminderConfig,
  GoalReminderConfigDTO,
  GoalReminderConfigPersistenceDTO,
} from './goal-reminder-config';

export { SnapshotTrigger } from './key-result-weight-snapshot';
export type {
  SnapshotTrigger as SnapshotTriggerType,
  KeyResultWeightSnapshot,
  KeyResultWeightSnapshotDTO,
  KeyResultWeightSnapshotClientDTO,
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
  FocusModeServerDTO,
} from './focus-mode';

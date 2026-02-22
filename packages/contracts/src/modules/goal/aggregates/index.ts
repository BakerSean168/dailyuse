/**
 * Goal Aggregates Export
 * 目标聚合根导出
 */

// Goal 聚合根
export type {
  GoalServerDTO,
  GoalPersistenceDTO,
} from './goal-server';

export type {
  GoalClientDTO,
  GoalTimeRangeSummary,
} from './goal-client';

// GoalFolder 聚合根
export type {
  GoalFolderServerDTO,
  GoalFolderPersistenceDTO,
} from './goal-folder-server';

export type {
  GoalFolderClientDTO,
} from './goal-folder-client';

// FocusSession 聚合根
export type {
  FocusSessionServerDTO,
  FocusSessionPersistenceDTO,
} from './focus-session-server';

export type {
  FocusSessionClientDTO,
} from './focus-session-client';

// GoalRecord 实体
export type {
  GoalRecordClientDTO,
} from './goal-record-client';

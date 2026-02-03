/**
 * Goal Module - API Export
 * 
 * 【规范说明：API 层导出】
 * 按功能分组，每个操作导出相关的 Schema、Request、Response 类型
 */

export {
  // Goal CRUD
  CreateGoalSchema,
  type CreateGoalReq,
  type CreateGoalRes,
  UpdateGoalSchema,
  type UpdateGoalReq,
  type UpdateGoalRes,
  type GetGoalReq,
  type GetGoalRes,
  type DeleteGoalReq,
  type DeleteGoalRes,
  QueryGoalsSchema,
  type QueryGoalsReq,
  type QueryGoalsRes,
  type GetGoalAggregateReq,
  type GetGoalAggregateRes,
  BatchUpdateGoalStatusSchema,
  type BatchUpdateGoalStatusReq,
  type BatchUpdateGoalStatusRes,
  BatchMoveGoalsSchema,
  type BatchMoveGoalsReq,
  type BatchMoveGoalsRes,
  BatchDeleteGoalsSchema,
  type BatchDeleteGoalsReq,
  type BatchDeleteGoalsRes,

  // Key Result Operations
  AddKeyResultSchema,
  type AddKeyResultReq,
  type AddKeyResultRes,
  UpdateKeyResultSchema,
  type UpdateKeyResultReq,
  type UpdateKeyResultRes,
  GetKeyResultsSchema,
  type GetKeyResultsReq,
  type GetKeyResultsRes,
  UpdateKeyResultProgressSchema,
  type UpdateKeyResultProgressReq,
  type UpdateKeyResultProgressRes,

  // Goal Folder Operations
  CreateGoalFolderSchema,
  type CreateGoalFolderReq,
  type CreateGoalFolderRes,
  UpdateGoalFolderSchema,
  type UpdateGoalFolderReq,
  type UpdateGoalFolderRes,
  type GetGoalFolderReq,
  type GetGoalFolderRes,
  type DeleteGoalFolderReq,
  type DeleteGoalFolderRes,
  QueryGoalFoldersSchema,
  type QueryGoalFoldersReq,
  type QueryGoalFoldersRes,

  // Goal Review Operations
  CreateGoalReviewSchema,
  type CreateGoalReviewReq,
  type CreateGoalReviewRes,
  UpdateGoalReviewSchema,
  type UpdateGoalReviewReq,
  type UpdateGoalReviewRes,
  type GetGoalReviewReq,
  type GetGoalReviewRes,
  type DeleteGoalReviewReq,
  type DeleteGoalReviewRes,
  GetGoalReviewsSchema,
  type GetGoalReviewsReq,
  type GetGoalReviewsRes,

  // Goal Record Operations
  CreateGoalRecordSchema,
  type CreateGoalRecordReq,
  type CreateGoalRecordRes,
  GetGoalRecordsSchema,
  type GetGoalRecordsReq,
  type GetGoalRecordsRes,

  // Focus Session Operations
  StartFocusSchema,
  type StartFocusReq,
  type StartFocusRes,
  StopFocusSchema,
  type StopFocusReq,
  type StopFocusRes,
  type GetFocusStatusReq,
  type GetFocusStatusRes,
  GetFocusHistorySchema,
  type GetFocusHistoryReq,
  type GetFocusHistoryRes,
  type GetFocusStatisticsReq,
  type GetFocusStatisticsRes,
  type GetPomodoroConfigReq,
  type GetPomodoroConfigRes,

  // Decomposition Operations
  DecomposeGoalSchema,
  type DecomposeGoalReq,
  type DecomposeGoalRes,

  // Import/Export Operations
  ExportGoalsSchema,
  type ExportGoalsReq,
  type ExportGoalsRes,
  ImportGoalsSchema,
  type ImportGoalsReq,
  type ImportGoalsRes,

  // Time Estimation Operations
  EstimateTimeSchema,
  type EstimateTimeReq,
  type EstimateTimeRes,
  BatchEstimateTimeSchema,
  type BatchEstimateTimeReq,
  type BatchEstimateTimeRes,
} from './crud';

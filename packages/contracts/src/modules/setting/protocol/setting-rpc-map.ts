import type {
  GetUserSettingReq,
  GetUserSettingRes,
  CreateUserSettingReq,
  CreateUserSettingRes,
  UpdateUserSettingReq,
  UpdateUserSettingRes,
  UpdateAppearanceReq,
  UpdateAppearanceRes,
  UpdateLocaleReq,
  UpdateLocaleRes,
  UpdateWorkflowReq,
  UpdateWorkflowRes,
  UpdatePrivacyReq,
  UpdatePrivacyRes,
  UpdateExperimentalReq,
  UpdateExperimentalRes,
  ResetUserSettingReq,
  ResetUserSettingRes,
  GetAppConfigReq,
  GetAppConfigRes,
  UpdateAppConfigReq,
  UpdateAppConfigRes,
  UpdateSettingEntryReq,
  UpdateSettingEntryRes,
  BatchUpdateSettingEntriesReq,
  BatchUpdateSettingEntriesRes,
  DeleteSettingEntryReq,
  DeleteSettingEntryRes,
  QuerySettingEntriesQuery,
  QuerySettingEntriesRes,
  SyncSettingsReq,
  SyncSettingsRes,
  ExportSettingsReq,
  ExportSettingsRes,
  ImportSettingsReq,
  ImportSettingsRes,
} from '../api';

export type SettingRpcMap = {
  'setting:get-user-setting': [GetUserSettingReq, GetUserSettingRes];
  'setting:create-user-setting': [CreateUserSettingReq, CreateUserSettingRes];
  'setting:update-user-setting': [UpdateUserSettingReq, UpdateUserSettingRes];
  'setting:update-appearance': [UpdateAppearanceReq, UpdateAppearanceRes];
  'setting:update-locale': [UpdateLocaleReq, UpdateLocaleRes];
  'setting:update-workflow': [UpdateWorkflowReq, UpdateWorkflowRes];
  'setting:update-privacy': [UpdatePrivacyReq, UpdatePrivacyRes];
  'setting:update-experimental': [UpdateExperimentalReq, UpdateExperimentalRes];
  'setting:reset-user-setting': [ResetUserSettingReq, ResetUserSettingRes];

  'setting:get-app-config': [GetAppConfigReq, GetAppConfigRes];
  'setting:update-app-config': [UpdateAppConfigReq, UpdateAppConfigRes];

  'setting:update-entry': [UpdateSettingEntryReq, UpdateSettingEntryRes];
  'setting:batch-update-entries': [BatchUpdateSettingEntriesReq, BatchUpdateSettingEntriesRes];
  'setting:delete-entry': [DeleteSettingEntryReq, DeleteSettingEntryRes];
  'setting:query-entries': [QuerySettingEntriesQuery, QuerySettingEntriesRes];

  'setting:sync': [SyncSettingsReq, SyncSettingsRes];
  'setting:export': [ExportSettingsReq, ExportSettingsRes];
  'setting:import': [ImportSettingsReq, ImportSettingsRes];
};

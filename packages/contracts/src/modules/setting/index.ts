/**
 * Setting Module - Contracts Package Index
 * 设置模块 - Contracts 包索引
 */

// ============ Enums ============
export {
  SettingValueType,
  SettingScope,
  UIInputType,
  OperatorType,
  AppEnvironment,
  ThemeMode,
  FontSize,
  DateFormat,
  TimeFormat,
  TaskViewType,
  GoalViewType,
  ScheduleViewType,
  ProfileVisibility,
} from './enums';

// ============ Value Objects - Server ============
export type {
  ValidationRuleServer,
  ValidationRuleServerDTO,} from './value-objects/validation-rule-server';

export type {
  UIConfigServer,
  UIConfigServerDTO,} from './value-objects/ui-config-server';

export type {
  SyncConfigServer,
  SyncConfigServerDTO,} from './value-objects/sync-config-server';

// ============ Value Objects - Client ============
export type {
  ValidationRuleClient,
  ValidationRuleClientDTO,} from './value-objects/validation-rule-client';

export type {
  UIConfigClient,
  UIConfigClientDTO,} from './value-objects/ui-config-client';

export type {
  SyncConfigClient,
  SyncConfigClientDTO,} from './value-objects/sync-config-client';

// ============ Entities - Server ============
export type {
  SettingHistoryServer,
  SettingHistoryServerDTO,
  SettingHistoryPersistenceDTO,} from './entities/setting-history-server';

export type {
  SettingItemServer,
  SettingItemServerDTO,
  SettingItemPersistenceDTO,} from './entities/setting-item-server';

export type {
  SettingGroupServer,
  SettingGroupServerDTO,
  SettingGroupPersistenceDTO,} from './entities/setting-group-server';

// ============ Entities - Client ============
export type {
  SettingHistoryClient,
  SettingHistoryClientDTO,} from './entities/setting-history-client';

export type {
  SettingItemClient,
  SettingItemClientDTO,} from './entities/setting-item-client';

export type {
  SettingGroupClient,
  SettingGroupClientDTO,} from './entities/setting-group-client';

// ============ Aggregates - Server ============
export type {
  SettingServer,
  SettingServerDTO,
  SettingPersistenceDTO,} from './aggregates/setting-server';

export type {
  AppConfigServer,
  AppConfigServerDTO,
  AppConfigPersistenceDTO,} from './aggregates/app-config-server';

export type {
  UserSettingServer,
  UserSettingServerDTO,
  UserSettingPersistenceDTO,} from './aggregates/user-setting-server';

// ============ Aggregates - Client ============
export type {
  SettingClient,
  SettingClientDTO,} from './aggregates/setting-client';

export type {
  AppConfigClient,
  AppConfigClientDTO,} from './aggregates/app-config-client';

export type {
  UserSettingClient,
  UserSettingClientDTO,} from './aggregates/user-setting-client';

// ============ API Requests/Responses ============
export type {
  // Setting API
  CreateSettingRequest,
  UpdateSettingRequest,
  GetSettingsRequest,
  ResetSettingsRequest,
  SettingResponse,
  SettingsListResponse,

  // AppConfig API
  UpdateAppConfigRequest,
  AppConfigResponse,

  // UserSetting API
  CreateUserSettingRequest,
  UpdateUserSettingRequest,
  UserSettingResponse,
  UpdateAppearanceRequest,
  UpdateLocaleRequest,
  UpdateWorkflowRequest,
  UpdatePrivacyRequest,
  UpdateExperimentalRequest,
  UpdateShortcutRequest,

  // Batch Operations
  BatchUpdateSettingsRequest,
  BatchDeleteSettingsRequest,
  BatchOperationResponse,

  // Sync
  SyncSettingsRequest,
  SyncSettingsResponse,

  // History
  GetSettingHistoryRequest,
  SettingHistoryResponse,

  // Filter and Sort
  SettingFilter,
  SettingSort,
  GetSettingsWithPaginationRequest,
} from './api-requests';

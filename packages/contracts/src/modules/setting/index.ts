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
  ValidationRuleServerDTO,} from './value-objects/ValidationRuleServer';

export type {
  UIConfigServer,
  UIConfigServerDTO,} from './value-objects/UIConfigServer';

export type {
  SyncConfigServer,
  SyncConfigServerDTO,} from './value-objects/SyncConfigServer';

// ============ Value Objects - Client ============
export type {
  ValidationRuleClient,
  ValidationRuleClientDTO,} from './value-objects/ValidationRuleClient';

export type {
  UIConfigClient,
  UIConfigClientDTO,} from './value-objects/UIConfigClient';

export type {
  SyncConfigClient,
  SyncConfigClientDTO,} from './value-objects/SyncConfigClient';

// ============ Entities - Server ============
export type {
  SettingHistoryServer,
  SettingHistoryServerDTO,
  SettingHistoryPersistenceDTO,} from './entities/SettingHistoryServer';

export type {
  SettingItemServer,
  SettingItemServerDTO,
  SettingItemPersistenceDTO,} from './entities/SettingItemServer';

export type {
  SettingGroupServer,
  SettingGroupServerDTO,
  SettingGroupPersistenceDTO,} from './entities/SettingGroupServer';

// ============ Entities - Client ============
export type {
  SettingHistoryClient,
  SettingHistoryClientDTO,} from './entities/SettingHistoryClient';

export type {
  SettingItemClient,
  SettingItemClientDTO,} from './entities/SettingItemClient';

export type {
  SettingGroupClient,
  SettingGroupClientDTO,} from './entities/SettingGroupClient';

// ============ Aggregates - Server ============
export type {
  SettingServer,
  SettingServerDTO,
  SettingPersistenceDTO,} from './aggregates/SettingServer';

export type {
  AppConfigServer,
  AppConfigServerDTO,
  AppConfigPersistenceDTO,} from './aggregates/AppConfigServer';

export type {
  UserSettingServer,
  UserSettingServerDTO,
  UserSettingPersistenceDTO,} from './aggregates/UserSettingServer';

// ============ Aggregates - Client ============
export type {
  SettingClient,
  SettingClientDTO,} from './aggregates/SettingClient';

export type {
  AppConfigClient,
  AppConfigClientDTO,} from './aggregates/AppConfigClient';

export type {
  UserSettingClient,
  UserSettingClientDTO,} from './aggregates/UserSettingClient';

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

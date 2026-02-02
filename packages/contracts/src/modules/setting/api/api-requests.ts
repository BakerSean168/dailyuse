/**
 * Setting Module - API Request/Response DTOs
 * 设置模块 - API 请求/响应 DTOs
 */

import type { SettingValueType, SettingScope } from './value-objects';
import type { SettingServerDTO } from './aggregates/setting-server';
import type { AppConfigServerDTO } from './aggregates/app-config-server';
import type { UserSettingServerDTO } from './aggregates/user-setting-server';

// ============ Setting API ============

/**
 * 创建设置请求
 */
export interface CreateSettingRequest {
  key: string;
  name: string;
  valueType: SettingValueType;
  value: unknown;
  defaultValue: unknown;
  scope: SettingScope;
  accountUuid?: string;
  deviceId?: string;
  groupUuid?: string;
  validation?: {
    required: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: unknown[];
    custom?: string;
  };
  ui?: {
    inputType: string;
    label: string;
    placeholder?: string;
    helpText?: string;
    icon?: string;
    order: number;
    visible: boolean;
    disabled: boolean;
    options?: Array<{ label: string; value: unknown }>;
    min?: number;
    max?: number;
    step?: number;
  };
  isEncrypted?: boolean;
  isReadOnly?: boolean;
  syncConfig?: {
    enabled: boolean;
    syncToCloud: boolean;
    syncToDevices: boolean;
  };
}

/**
 * 更新设置请求
 */
export interface UpdateSettingRequest {
  uuid: string;
  value?: unknown;
  name?: string;
  validation?: CreateSettingRequest['validation'];
  ui?: CreateSettingRequest['ui'];
  isEncrypted?: boolean;
  isReadOnly?: boolean;
  syncConfig?: CreateSettingRequest['syncConfig'];
}

/**
 * 获取设置列表请求
 */
export interface GetSettingsRequest {
  scope?: SettingScope;
  accountUuid?: string;
  deviceId?: string;
  groupUuid?: string;
  key?: string;
  keys?: string[];
  includeDeleted?: boolean;
}

/**
 * 重置设置请求
 */
export interface ResetSettingsRequest {
  uuids?: string[];
  scope?: SettingScope;
  accountUuid?: string;
  deviceId?: string;
  groupUuid?: string;
}

/**
 * 设置响应
 */
export interface SettingResponse {
  ok: boolean;
  data?: SettingServerDTO;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 设置列表响应
 */
export interface SettingsListResponse {
  ok: boolean;
  data?: SettingServerDTO[];
  total?: number;
  error?: {
    code: string;
    message: string;
  };
}

// ============ AppConfig API ============

/**
 * 更新应用配置请求
 */
export interface UpdateAppConfigRequest {
  uuid: string;
  app?: {
    name?: string;
    version?: string;
    buildNumber?: number;
    environment?: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  };
  features?: {
    enableGoals?: boolean;
    enableTasks?: boolean;
    enableSchedules?: boolean;
    enableReminders?: boolean;
    enableRepositories?: boolean;
    enableAiAssistant?: boolean;
    enableCollaboration?: boolean;
    enableAnalytics?: boolean;
  };
  limits?: {
    maxAccounts?: number;
    maxGoals?: number;
    maxTasks?: number;
    maxSchedules?: number;
    maxReminders?: number;
    maxRepositories?: number;
    maxFileSize?: number;
    maxStorageSize?: number;
  };
  api?: {
    baseUrl?: string;
    timeout?: number;
    retryCount?: number;
    retryDelay?: number;
  };
  security?: {
    sessionTimeout?: number;
    maxLoginAttempts?: number;
    lockoutDuration?: number;
    passwordMinLength?: number;
    passwordRequireUppercase?: boolean;
    passwordRequireNumbers?: boolean;
    passwordRequireSymbols?: boolean;
    twoFactorEnabled?: boolean;
  };
  notifications?: {
    enabled?: boolean;
    channels?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      inApp?: boolean;
    };
    rateLimit?: {
      maxPerMinute?: number;
      maxPerHour?: number;
      maxPerDay?: number;
    };
  };
}

/**
 * 应用配置响应
 */
export interface AppConfigResponse {
  ok: boolean;
  data?: AppConfigServerDTO;
  error?: {
    code: string;
    message: string;
  };
}

// ============ UserSetting API ============

/**
 * 创建用户设置请求
 */
export interface CreateUserSettingRequest {
  accountUuid: string;
  appearance?: {
    theme?: 'LIGHT' | 'DARK' | 'AUTO';
    accentColor?: string;
    fontSize?: 'SMALL' | 'MEDIUM' | 'LARGE';
    fontFamily?: string | null;
    compactMode?: boolean;
  };
  locale?: {
    language?: string;
    timezone?: string;
    dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
    timeFormat?: '12H' | '24H';
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    currency?: string;
  };
  workflow?: {
    defaultTaskView?: 'LIST' | 'KANBAN' | 'CALENDAR';
    defaultGoalView?: 'LIST' | 'TREE' | 'TIMELINE';
    defaultScheduleView?: 'DAY' | 'WEEK' | 'MONTH';
    autoSave?: boolean;
    autoSaveInterval?: number;
    confirmBeforeDelete?: boolean;
  };
  shortcuts?: {
    enabled?: boolean;
    custom?: Record<string, string>;
  };
  privacy?: {
    profileVisibility?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
    showOnlineStatus?: boolean;
    allowSearchByEmail?: boolean;
    allowSearchByPhone?: boolean;
    shareUsageData?: boolean;
  };
  experimental?: {
    enabled?: boolean;
    features?: string[];
  };
}

/**
 * 更新用户设置请求
 */
export interface UpdateUserSettingRequest {
  uuid: string;
  appearance?: {
    theme?: 'LIGHT' | 'DARK' | 'AUTO';
    accentColor?: string;
    fontSize?: 'SMALL' | 'MEDIUM' | 'LARGE';
    fontFamily?: string | null;
    compactMode?: boolean;
  };
  locale?: {
    language?: string;
    timezone?: string;
    dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
    timeFormat?: '12H' | '24H';
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    currency?: string;
  };
  workflow?: {
    defaultTaskView?: 'LIST' | 'KANBAN' | 'CALENDAR';
    defaultGoalView?: 'LIST' | 'TREE' | 'TIMELINE';
    defaultScheduleView?: 'DAY' | 'WEEK' | 'MONTH';
    autoSave?: boolean;
    autoSaveInterval?: number;
    confirmBeforeDelete?: boolean;
  };
  shortcuts?: {
    enabled?: boolean;
    custom?: Record<string, string>;
  };
  privacy?: {
    profileVisibility?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
    showOnlineStatus?: boolean;
    allowSearchByEmail?: boolean;
    allowSearchByPhone?: boolean;
    shareUsageData?: boolean;
  };
  experimental?: {
    enabled?: boolean;
    features?: string[];
  };
}

/**
 * 用户设置响应
 */
export interface UserSettingResponse {
  ok: boolean;
  data?: UserSettingServerDTO;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 更新外观设置请求
 */
export interface UpdateAppearanceRequest {
  theme?: 'LIGHT' | 'DARK' | 'AUTO';
  accentColor?: string;
  fontSize?: 'SMALL' | 'MEDIUM' | 'LARGE';
  fontFamily?: string | null;
  compactMode?: boolean;
}

/**
 * 更新语言区域设置请求
 */
export interface UpdateLocaleRequest {
  language?: string;
  timezone?: string;
  dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  timeFormat?: '12H' | '24H';
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  currency?: string;
}

/**
 * 更新工作流设置请求
 */
export interface UpdateWorkflowRequest {
  defaultTaskView?: 'LIST' | 'KANBAN' | 'CALENDAR';
  defaultGoalView?: 'LIST' | 'TREE' | 'TIMELINE';
  defaultScheduleView?: 'DAY' | 'WEEK' | 'MONTH';
  autoSave?: boolean;
  autoSaveInterval?: number;
  confirmBeforeDelete?: boolean;
}

/**
 * 更新隐私设置请求
 */
export interface UpdatePrivacyRequest {
  profileVisibility?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
  showOnlineStatus?: boolean;
  allowSearchByEmail?: boolean;
  allowSearchByPhone?: boolean;
  shareUsageData?: boolean;
}

/**
 * 更新实验性功能请求
 */
export interface UpdateExperimentalRequest {
  enabled?: boolean;
  features?: string[];
}

/**
 * 更新快捷键请求
 */
export interface UpdateShortcutRequest {
  action: string;
  shortcut: string;
}

// ============ 批量操作 API ============

/**
 * 批量更新设置请求
 */
export interface BatchUpdateSettingsRequest {
  updates: Array<{
    uuid: string;
    value: unknown;
  }>;
}

/**
 * 批量删除设置请求
 */
export interface BatchDeleteSettingsRequest {
  uuids: string[];
}

/**
 * 批量操作响应
 */
export interface BatchOperationResponse {
  ok: boolean;
  data?: {
    succeeded: string[];
    failed: Array<{
      uuid: string;
      error: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============ 同步 API ============

/**
 * 同步设置请求
 */
export interface SyncSettingsRequest {
  uuids?: string[];
  scope?: SettingScope;
  accountUuid?: string;
  deviceId?: string;
  lastSyncTime?: number;
}

/**
 * 同步设置响应
 */
export interface SyncSettingsResponse {
  ok: boolean;
  data?: {
    synced: SettingServerDTO[];
    conflicts: Array<{
      uuid: string;
      local: SettingServerDTO;
      remote: SettingServerDTO;
    }>;
    deleted: string[];
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============ 历史记录 API ============

/**
 * 获取设置历史请求
 */
export interface GetSettingHistoryRequest {
  settingUuid: string;
  limit?: number;
  offset?: number;
  startTime?: number;
  endTime?: number;
}

/**
 * 设置历史响应
 */
export interface SettingHistoryResponse {
  ok: boolean;
  data?: Array<{
    uuid: string;
    settingUuid: string;
    oldValue: unknown;
    newValue: unknown;
    operator: 'USER' | 'SYSTEM' | 'SYNC' | 'IMPORT' | 'RESET';
    operatorUuid?: string;
    changedAt: number;
  }>;
  total?: number;
  error?: {
    code: string;
    message: string;
  };
}

// ============ 过滤和排序 ============

/**
 * 设置过滤条件
 */
export interface SettingFilter {
  scope?: SettingScope;
  accountUuid?: string;
  deviceId?: string;
  groupUuid?: string;
  key?: string;
  keys?: string[];
  valueType?: SettingValueType;
  isEncrypted?: boolean;
  isReadOnly?: boolean;
  isDeleted?: boolean;
}

/**
 * 设置排序
 */
export interface SettingSort {
  field: 'key' | 'name' | 'createdAt' | 'updatedAt' | 'scope';
  order: 'ASC' | 'DESC';
}

/**
 * 带分页的设置列表请求
 */
export interface GetSettingsWithPaginationRequest {
  filter?: SettingFilter;
  sort?: SettingSort;
  limit?: number;
  offset?: number;
}

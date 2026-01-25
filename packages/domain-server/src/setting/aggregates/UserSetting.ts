/**
 * UserSetting Aggregate Root
 * 用户设置聚合根
 *
 * 位置：domain-server/setting/aggregates/UserSetting.ts
 * 文件路径已明确表明这是服务端聚合，无需在类名添加 Server 后缀
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  UserSettingClientDTO,
  UserSettingPersistenceDTO,
  UserSettingServer,
  UserSettingServerDTO,
} from '@dailyuse/contracts/setting';
import {
  DateFormat,
  FontSize,
  GoalViewType,
  ProfileVisibility,
  ScheduleViewType,
  TaskViewType,
  ThemeMode,
  TimeFormat,
} from '@dailyuse/contracts/setting';

/**
 * 用户设置聚合根
 */
export class UserSetting extends AggregateRoot implements UserSettingServer {
  private _accountUuid: string;
  private _appearance: {
    theme: ThemeMode;
    accentColor: string;
    fontSize: FontSize;
    fontFamily?: string | null;
    compactMode: boolean;
  };
  private _locale: {
    language: string;
    timezone: string;
    dateFormat: DateFormat;
    timeFormat: TimeFormat;
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    currency: string;
  };
  private _workflow: {
    defaultTaskView: TaskViewType;
    defaultGoalView: GoalViewType;
    defaultScheduleView: ScheduleViewType;
    autoSave: boolean;
    autoSaveInterval: number;
    confirmBeforeDelete: boolean;
  };
  private _shortcuts: {
    enabled: boolean;
    custom: Record<string, string>;
  };
  private _privacy: {
    profileVisibility: ProfileVisibility;
    showOnlineStatus: boolean;
    allowSearchByEmail: boolean;
    allowSearchByPhone: boolean;
    shareUsageData: boolean;
  };
  private _experimental: {
    enabled: boolean;
    features: string[];
  };
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    appearance: UserSetting['_appearance'];
    locale: UserSetting['_locale'];
    workflow: UserSetting['_workflow'];
    shortcuts: UserSetting['_shortcuts'];
    privacy: UserSetting['_privacy'];
    experimental: UserSetting['_experimental'];
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._appearance = params.appearance;
    this._locale = params.locale;
    this._workflow = params.workflow;
    this._shortcuts = params.shortcuts;
    this._privacy = params.privacy;
    // 最终防护：确保 features 始终是数组
    this._experimental = {
      enabled: params.experimental.enabled,
      features: Array.isArray(params.experimental.features) ? params.experimental.features : [],
    };
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ========== Getters ==========

  get accountUuid(): string {
    return this._accountUuid;
  }

  get appearance(): UserSetting['_appearance'] {
    return { ...this._appearance };
  }

  get locale(): UserSetting['_locale'] {
    return { ...this._locale };
  }

  get workflow(): UserSetting['_workflow'] {
    return { ...this._workflow };
  }

  get shortcuts(): UserSetting['_shortcuts'] {
    return {
      enabled: this._shortcuts.enabled,
      custom: { ...this._shortcuts.custom },
    };
  }

  get privacy(): UserSetting['_privacy'] {
    return { ...this._privacy };
  }

  get experimental(): UserSetting['_experimental'] {
    return {
      enabled: this._experimental.enabled,
      features: [...this._experimental.features],
    };
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  // ========== 外观管理 ==========

  updateAppearance(appearance: Partial<UserSetting['_appearance']>): void {
    this._appearance = { ...this._appearance, ...appearance };
    this._updatedAt = new Date();
  }

  updateTheme(theme: ThemeMode): void {
    this._appearance.theme = theme;
    this._updatedAt = new Date();
  }

  // ========== 语言和区域 ==========

  updateLocale(locale: Partial<UserSetting['_locale']>): void {
    this._locale = { ...this._locale, ...locale };
    this._updatedAt = new Date();
  }

  updateLanguage(language: string): void {
    this._locale.language = language;
    this._updatedAt = new Date();
  }

  updateTimezone(timezone: string): void {
    this._locale.timezone = timezone;
    this._updatedAt = new Date();
  }

  // ========== 工作流 ==========

  updateWorkflow(workflow: Partial<UserSetting['_workflow']>): void {
    this._workflow = { ...this._workflow, ...workflow };
    this._updatedAt = new Date();
  }

  // ========== 快捷键 ==========

  updateShortcut(action: string, shortcut: string): void {
    this._shortcuts.custom[action] = shortcut;
    this._updatedAt = new Date();
  }

  removeShortcut(action: string): void {
    delete this._shortcuts.custom[action];
    this._updatedAt = new Date();
  }

  // ========== 隐私 ==========

  updatePrivacy(privacy: Partial<UserSetting['_privacy']>): void {
    this._privacy = { ...this._privacy, ...privacy };
    this._updatedAt = new Date();
  }

  // ========== 实验性功能 ==========

  enableExperimentalFeature(feature: string): void {
    if (!this._experimental.features.includes(feature)) {
      this._experimental.features.push(feature);
      this._updatedAt = new Date();
    }
  }

  disableExperimentalFeature(feature: string): void {
    const index = this._experimental.features.indexOf(feature);
    if (index > -1) {
      this._experimental.features.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  // ========== DTO 转换 ==========

  toServerDTO(): UserSettingServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      appearance: this._appearance,
      locale: this._locale,
      workflow: this._workflow,
      shortcuts: this._shortcuts,
      privacy: this._privacy,
      experimental: this._experimental,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  toClientDTO(): UserSettingClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      appearance: this._appearance,
      locale: this._locale,
      workflow: this._workflow,
      shortcuts: this._shortcuts,
      privacy: this._privacy,
      experimental: this._experimental,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      themeText: ThemeMode[this._appearance.theme],
      languageText: this._locale.language,
      experimentalFeatureCount: this._experimental.features.length,
    };
  }

  toPersistenceDTO(): UserSettingPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,

      // Appearance - 扁平化
      appearanceTheme: this._appearance.theme,
      appearanceAccentColor: this._appearance.accentColor,
      appearanceFontSize: this._appearance.fontSize,
      appearanceFontFamily: this._appearance.fontFamily ?? null,
      appearanceCompactMode: this._appearance.compactMode,

      // Locale - 扁平化
      localeLanguage: this._locale.language,
      localeTimezone: this._locale.timezone,
      localeDateFormat: this._locale.dateFormat,
      localeTimeFormat: this._locale.timeFormat,
      localeWeekStartsOn: this._locale.weekStartsOn,
      localeCurrency: this._locale.currency,

      // Workflow - 扁平化
      workflowDefaultTaskView: this._workflow.defaultTaskView,
      workflowDefaultGoalView: this._workflow.defaultGoalView,
      workflowDefaultScheduleView: this._workflow.defaultScheduleView,
      workflowAutoSave: this._workflow.autoSave,
      workflowAutoSaveInterval: this._workflow.autoSaveInterval,
      workflowConfirmBeforeDelete: this._workflow.confirmBeforeDelete,

      // Shortcuts - custom 为 JSON
      shortcutsEnabled: this._shortcuts.enabled,
      shortcutsCustom: JSON.stringify(this._shortcuts.custom),

      // Privacy - 扁平化
      privacyProfileVisibility: this._privacy.profileVisibility,
      privacyShowOnlineStatus: this._privacy.showOnlineStatus,
      privacyAllowSearchByEmail: this._privacy.allowSearchByEmail,
      privacyAllowSearchByPhone: this._privacy.allowSearchByPhone,
      privacyShareUsageData: this._privacy.shareUsageData,

      // Experimental - features 为 JSON
      experimentalEnabled: this._experimental.enabled,
      experimentalFeatures: JSON.stringify(this._experimental.features),

      // Timestamps
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ========== 静态工厂方法 ==========

  static create(params: {
    accountUuid: string;
    appearance?: Partial<UserSettingServer['appearance']>;
    locale?: Partial<UserSettingServer['locale']>;
    workflow?: Partial<UserSettingServer['workflow']>;
    shortcuts?: Partial<UserSettingServer['shortcuts']>;
    privacy?: Partial<UserSettingServer['privacy']>;
    experimental?: Partial<UserSettingServer['experimental']>;
  }): UserSetting {
    const now = Date.now();

    // 默认外观设置
    const defaultAppearance: UserSetting['_appearance'] = {
      theme: ThemeMode.AUTO,
      accentColor: '#3B82F6',
      fontSize: FontSize.MEDIUM,
      fontFamily: null,
      compactMode: false,
    };

    // 默认语言和区域设置
    const defaultLocale: UserSetting['_locale'] = {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      dateFormat: DateFormat.YYYY_MM_DD,
      timeFormat: TimeFormat.H24,
      weekStartsOn: 1, // Monday
      currency: 'CNY',
    };

    // 默认工作流设置
    const defaultWorkflow: UserSetting['_workflow'] = {
      defaultTaskView: TaskViewType.LIST,
      defaultGoalView: GoalViewType.LIST,
      defaultScheduleView: ScheduleViewType.WEEK,
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      confirmBeforeDelete: true,
    };

    // 默认快捷键设置
    const defaultShortcuts: UserSetting['_shortcuts'] = {
      enabled: true,
      custom: {},
    };

    // 默认隐私设置
    const defaultPrivacy: UserSetting['_privacy'] = {
      profileVisibility: ProfileVisibility.PRIVATE,
      showOnlineStatus: true,
      allowSearchByEmail: true,
      allowSearchByPhone: false,
      shareUsageData: false,
    };

    // 默认实验性功能设置
    const defaultExperimental: UserSetting['_experimental'] = {
      enabled: false,
      features: [],
    };

    const appearance: UserSetting['_appearance'] = {
      ...defaultAppearance,
      ...params.appearance,
      theme: (params.appearance?.theme as ThemeMode) || defaultAppearance.theme,
      fontSize: (params.appearance?.fontSize as FontSize) || defaultAppearance.fontSize,
    };

    const locale: UserSetting['_locale'] = {
      ...defaultLocale,
      ...params.locale,
      dateFormat: (params.locale?.dateFormat as DateFormat) || defaultLocale.dateFormat,
      timeFormat: (params.locale?.timeFormat as TimeFormat) || defaultLocale.timeFormat,
    };

    const workflow: UserSetting['_workflow'] = {
      ...defaultWorkflow,
      ...params.workflow,
      defaultTaskView:
        (params.workflow?.defaultTaskView as TaskViewType) || defaultWorkflow.defaultTaskView,
      defaultGoalView:
        (params.workflow?.defaultGoalView as GoalViewType) || defaultWorkflow.defaultGoalView,
      defaultScheduleView:
        (params.workflow?.defaultScheduleView as ScheduleViewType) ||
        defaultWorkflow.defaultScheduleView,
    };

    const privacy: UserSetting['_privacy'] = {
      ...defaultPrivacy,
      ...params.privacy,
      profileVisibility:
        (params.privacy?.profileVisibility as ProfileVisibility) ||
        defaultPrivacy.profileVisibility,
    };

    return new UserSetting({
      accountUuid: params.accountUuid,
      appearance,
      locale,
      workflow,
      shortcuts: { ...defaultShortcuts, ...params.shortcuts },
      privacy,
      experimental: { ...defaultExperimental, ...params.experimental },
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromServerDTO(dto: UserSettingServerDTO): UserSetting {
    // 如果 DTO 是空对象或缺少必需字段，抛出错误
    if (!dto.accountUuid) {
      throw new Error('fromServerDTO requires accountUuid in dto');
    }

    // 安全地处理可能缺失的字段，使用默认值
    const experimental = {
      enabled: dto.experimental?.enabled ?? false,
      features: Array.isArray(dto.experimental?.features) ? dto.experimental.features : [],
    };

    const appearance = dto.appearance
      ? {
          ...dto.appearance,
          theme: (dto.appearance.theme as ThemeMode) || ThemeMode.LIGHT,
          fontSize: (dto.appearance.fontSize as FontSize) || FontSize.MEDIUM,
          fontFamily: dto.appearance.fontFamily ?? null,
        }
      : {
          theme: ThemeMode.LIGHT,
          accentColor: '#1976d2',
          fontSize: FontSize.MEDIUM,
          fontFamily: null,
          compactMode: false,
        };

    const locale = dto.locale
      ? {
          ...dto.locale,
          dateFormat: (dto.locale.dateFormat as DateFormat) || DateFormat.YYYY_MM_DD,
          timeFormat: (dto.locale.timeFormat as TimeFormat) || TimeFormat.H24,
        }
      : {
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          dateFormat: DateFormat.YYYY_MM_DD,
          timeFormat: TimeFormat.H24,
          weekStartsOn: 1 as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          currency: 'CNY',
        };

    const workflow = dto.workflow
      ? {
          ...dto.workflow,
          defaultTaskView: (dto.workflow.defaultTaskView as TaskViewType) || TaskViewType.LIST,
          defaultGoalView: (dto.workflow.defaultGoalView as GoalViewType) || GoalViewType.LIST,
          defaultScheduleView:
            (dto.workflow.defaultScheduleView as ScheduleViewType) || ScheduleViewType.WEEK,
        }
      : {
          defaultTaskView: TaskViewType.LIST,
          defaultGoalView: GoalViewType.LIST,
          defaultScheduleView: ScheduleViewType.WEEK,
          autoSave: true,
          autoSaveInterval: 30000,
          confirmBeforeDelete: true,
        };

    const shortcuts = dto.shortcuts || {
      enabled: true,
      custom: {},
    };

    const privacy = dto.privacy
      ? {
          ...dto.privacy,
          profileVisibility:
            (dto.privacy.profileVisibility as ProfileVisibility) || ProfileVisibility.PUBLIC,
        }
      : {
          profileVisibility: ProfileVisibility.PUBLIC,
          showOnlineStatus: true,
          allowSearchByEmail: false,
          allowSearchByPhone: false,
          shareUsageData: true,
        };

    return new UserSetting({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      appearance,
      locale,
      workflow,
      shortcuts,
      privacy,
      experimental,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  static fromPersistenceDTO(dto: UserSettingPersistenceDTO): UserSetting {
    // 从扁平化的 DTO 重建嵌套结构
    const appearance: UserSetting['_appearance'] = {
      theme: dto.appearanceTheme as ThemeMode,
      accentColor: dto.appearanceAccentColor,
      fontSize: dto.appearanceFontSize as FontSize,
      fontFamily: dto.appearanceFontFamily,
      compactMode: dto.appearanceCompactMode,
    };

    const locale: UserSetting['_locale'] = {
      language: dto.localeLanguage,
      timezone: dto.localeTimezone,
      dateFormat: dto.localeDateFormat as DateFormat,
      timeFormat: dto.localeTimeFormat as TimeFormat,
      weekStartsOn: dto.localeWeekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      currency: dto.localeCurrency,
    };

    const workflow: UserSetting['_workflow'] = {
      defaultTaskView: dto.workflowDefaultTaskView as TaskViewType,
      defaultGoalView: dto.workflowDefaultGoalView as GoalViewType,
      defaultScheduleView: dto.workflowDefaultScheduleView as ScheduleViewType,
      autoSave: dto.workflowAutoSave,
      autoSaveInterval: dto.workflowAutoSaveInterval,
      confirmBeforeDelete: dto.workflowConfirmBeforeDelete,
    };

    const shortcuts: UserSetting['_shortcuts'] = {
      enabled: dto.shortcutsEnabled,
      custom: JSON.parse(dto.shortcutsCustom),
    };

    const privacy: UserSetting['_privacy'] = {
      profileVisibility: dto.privacyProfileVisibility as ProfileVisibility,
      showOnlineStatus: dto.privacyShowOnlineStatus,
      allowSearchByEmail: dto.privacyAllowSearchByEmail,
      allowSearchByPhone: dto.privacyAllowSearchByPhone,
      shareUsageData: dto.privacyShareUsageData,
    };

    // 安全地解析 experimental.features，确保它是一个数组
    let features: string[] = [];
    try {
      const parsed = JSON.parse(dto.experimentalFeatures);
      features = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to parse experimental features, using empty array:', error);
      features = [];
    }

    const experimental: UserSetting['_experimental'] = {
      enabled: dto.experimentalEnabled,
      features,
    };

    return new UserSetting({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      appearance,
      locale,
      workflow,
      shortcuts,
      privacy,
      experimental,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }
}

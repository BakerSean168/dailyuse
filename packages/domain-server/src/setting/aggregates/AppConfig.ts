/**
 * AppConfig Aggregate Root - Server Implementation
 * 应用配置聚合根 - 服务端实现
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  AppConfigClientDTO,
  AppConfigPersistenceDTO,
  AppConfigServer,
  AppConfigServerDTO,
} from '@dailyuse/contracts/setting';
import { AppEnvironment } from '@dailyuse/contracts/setting';

/**
 * 应用配置聚合根服务端实现
 */
export class AppConfig extends AggregateRoot implements AppConfigServer {
  private _version: string;
  private _app: {
    name: string;
    version: string;
    buildNumber: string;
    environment: AppEnvironment;
  };
  private _features: {
    goals: boolean;
    tasks: boolean;
    schedules: boolean;
    reminders: boolean;
    repositories: boolean;
    aiAssistant: boolean;
    collaboration: boolean;
    analytics: boolean;
  };
  private _limits: {
    maxAccountsPerDevice: number;
    maxGoalsPerAccount: number;
    maxTasksPerAccount: number;
    maxSchedulesPerAccount: number;
    maxRemindersPerAccount: number;
    maxRepositoriesPerAccount: number;
    maxFileSize: number;
    maxStorageSize: number;
  };
  private _api: {
    baseUrl: string;
    timeout: number;
    retryCount: number;
    retryDelay: number;
  };
  private _security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecialChars: boolean;
    twoFactorEnabled: boolean;
  };
  private _notifications: {
    enabled: boolean;
    channels: {
      inApp: boolean;
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    rateLimit: {
      maxPerHour: number;
      maxPerDay: number;
    };
  };
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    uuid: string,
    version: string,
    app: AppConfig['_app'],
    features: AppConfig['_features'],
    limits: AppConfig['_limits'],
    api: AppConfig['_api'],
    security: AppConfig['_security'],
    notifications: AppConfig['_notifications'],
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(uuid);
    this._version = version;
    this._app = app;
    this._features = features;
    this._limits = limits;
    this._api = api;
    this._security = security;
    this._notifications = notifications;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ========== Getters ==========

  get version(): string {
    return this._version;
  }

  get app(): AppConfig['_app'] {
    return { ...this._app };
  }

  get features(): AppConfig['_features'] {
    return { ...this._features };
  }

  get limits(): AppConfig['_limits'] {
    return { ...this._limits };
  }

  get api(): AppConfig['_api'] {
    return { ...this._api };
  }

  get security(): AppConfig['_security'] {
    return { ...this._security };
  }

  get notifications(): AppConfig['_notifications'] {
    return {
      ...this._notifications,
      channels: { ...this._notifications.channels },
      rateLimit: { ...this._notifications.rateLimit },
    };
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  // ========== 功能管理 ==========

  enableFeature(feature: string): void {
    if (feature in this._features) {
      this._features[feature as keyof typeof this._features] = true;
      this._updatedAt = new Date();
    }
  }

  disableFeature(feature: string): void {
    if (feature in this._features) {
      this._features[feature as keyof typeof this._features] = false;
      this._updatedAt = new Date();
    }
  }

  isFeatureEnabled(feature: string): boolean {
    return this._features[feature as keyof typeof this._features] ?? false;
  }

  // ========== 限制检查 ==========

  checkLimit(limitType: string, currentValue: number): boolean {
    const limit = this._limits[limitType as keyof typeof this._limits];
    if (typeof limit !== 'number') {
      return true;
    }
    return currentValue < limit;
  }

  // ========== 配置更新 ==========

  updateAppInfo(info: Partial<AppConfig['_app']>): void {
    this._app = { ...this._app, ...info };
    this._updatedAt = new Date();
  }

  updateLimits(limits: Partial<AppConfig['_limits']>): void {
    this._limits = { ...this._limits, ...limits };
    this._updatedAt = new Date();
  }

  updateApiConfig(config: Partial<AppConfig['_api']>): void {
    this._api = { ...this._api, ...config };
    this._updatedAt = new Date();
  }

  updateSecurityConfig(config: Partial<AppConfig['_security']>): void {
    this._security = { ...this._security, ...config };
    this._updatedAt = new Date();
  }

  // ========== DTO 转换 ==========

  toServerDTO(): AppConfigServerDTO {
    return {
      uuid: this.uuid,
      version: this._version,
      app: this._app,
      features: this._features,
      limits: this._limits,
      api: this._api,
      security: this._security,
      notifications: this._notifications,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  toClientDTO(): AppConfigClientDTO {
    return {
      uuid: this.uuid,
      version: this._version,
      app: this._app,
      features: this._features,
      limits: this._limits,
      appVersionText: `${this._app.name} v${this._app.version} (build ${this._app.buildNumber})`,
      environmentText:
        this._app.environment === AppEnvironment.PRODUCTION ? '生产环境' : '开发环境',
      enabledFeaturesCount: Object.values(this._features).filter((v) => v).length,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  toPersistenceDTO(): AppConfigPersistenceDTO {
    return {
      uuid: this.uuid,
      version: this._version,
      app: JSON.stringify(this._app),
      features: JSON.stringify(this._features),
      limits: JSON.stringify(this._limits),
      api: JSON.stringify(this._api),
      security: JSON.stringify(this._security),
      notifications: JSON.stringify(this._notifications),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ========== 静态工厂方法 ==========

  static create(params?: Partial<AppConfigServer>): AppConfig {
    const now = Date.now();

    // 默认配置
    const defaultApp = {
      name: 'DailyUse',
      version: '1.0.0',
      buildNumber: '1',
      environment: AppEnvironment.DEVELOPMENT,
    };

    const defaultFeatures = {
      goals: true,
      tasks: true,
      schedules: true,
      reminders: true,
      repositories: true,
      aiAssistant: false,
      collaboration: false,
      analytics: false,
    };

    const defaultLimits = {
      maxAccountsPerDevice: 5,
      maxGoalsPerAccount: 100,
      maxTasksPerAccount: 1000,
      maxSchedulesPerAccount: 500,
      maxRemindersPerAccount: 500,
      maxRepositoriesPerAccount: 50,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxStorageSize: 5 * 1024 * 1024 * 1024, // 5GB
    };

    const defaultApi = {
      baseUrl: 'http://localhost:3000',
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
    };

    const defaultSecurity = {
      sessionTimeout: 3600000, // 1 hour
      maxLoginAttempts: 5,
      lockoutDuration: 900000, // 15 minutes
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true,
      twoFactorEnabled: false,
    };

    const defaultNotifications = {
      enabled: true,
      channels: {
        inApp: true,
        email: true,
        push: true,
        sms: false,
      },
      rateLimit: {
        maxPerHour: 100,
        maxPerDay: 1000,
      },
    };

    const app: {
      name: string;
      version: string;
      buildNumber: string;
      environment: AppEnvironment;
    } = {
      ...defaultApp,
      ...params?.app,
      environment: (params?.app?.environment as AppEnvironment) || defaultApp.environment,
    };

    return new AppConfig(
      params?.uuid || AggregateRoot.generateUUID(),
      params?.version || '1.0.0',
      app,
      { ...defaultFeatures, ...params?.features },
      { ...defaultLimits, ...params?.limits },
      { ...defaultApi, ...params?.api },
      { ...defaultSecurity, ...params?.security },
      {
        ...defaultNotifications,
        ...params?.notifications,
        channels: {
          ...defaultNotifications.channels,
          ...params?.notifications?.channels,
        },
        rateLimit: {
          ...defaultNotifications.rateLimit,
          ...params?.notifications?.rateLimit,
        },
      },
      params?.createdAt || now,
      params?.updatedAt || now,
    );
  }

  static fromServerDTO(dto: AppConfigServerDTO): AppConfig {
    return new AppConfig(
      dto.uuid,
      dto.version,
      {
        ...dto.app,
        environment: dto.app.environment as AppEnvironment,
      },
      dto.features,
      dto.limits,
      dto.api,
      dto.security,
      dto.notifications,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  static fromPersistenceDTO(dto: AppConfigPersistenceDTO): AppConfig {
    return new AppConfig(
      dto.uuid,
      dto.version,
      JSON.parse(dto.app),
      JSON.parse(dto.features),
      JSON.parse(dto.limits),
      JSON.parse(dto.api),
      JSON.parse(dto.security),
      JSON.parse(dto.notifications),
      dto.createdAt,
      dto.updatedAt,
    );
  }
}

/**
 * AppConfig Aggregate Root - Server Implementation
 * 应用配置聚合根 - 服务端实现
 *
 * 用于管理服务端应用级配置
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  TransferDate,
  PersistenceDate,
  DomainDate,
  AppConfigId as IAppConfigId,
} from '@dailyuse/contracts/primitives';
import { createIdType } from '@dailyuse/utils';

// ============ AppConfigId Value Object ============
const AppConfigId = createIdType<IAppConfigId>('AppConfigId');
type AppConfigId = IAppConfigId;

// ============ Local Type Definitions ============
// TODO: Move these to @dailyuse/contracts/setting when finalizing API

export const AppEnvironment = {
  Development: 'Development',
  Staging: 'Staging',
  Production: 'Production',
} as const;

export type AppEnvironment = (typeof AppEnvironment)[keyof typeof AppEnvironment];

export interface AppConfigServer {
  id: AppConfigId;
  version: string;
  app: {
    name: string;
    version: string;
    buildNumber: string;
    environment: AppEnvironment;
  };
  features: {
    goals: boolean;
    tasks: boolean;
    schedules: boolean;
    reminders: boolean;
    repositories: boolean;
    aiAssistant: boolean;
    collaboration: boolean;
    analytics: boolean;
  };
  limits: {
    maxAccountsPerDevice: number;
    maxGoalsPerAccount: number;
    maxTasksPerAccount: number;
    maxSchedulesPerAccount: number;
    maxRemindersPerAccount: number;
    maxRepositoriesPerAccount: number;
    maxFileSize: number;
    maxStorageSize: number;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryCount: number;
    retryDelay: number;
  };
  security: {
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
  notifications: {
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
  createdAt: DomainDate;
  updatedAt: DomainDate;
}

export interface AppConfigServerDTO {
  id: string;
  version: string;
  app: AppConfigServer['app'];
  features: AppConfigServer['features'];
  limits: AppConfigServer['limits'];
  api: AppConfigServer['api'];
  security: AppConfigServer['security'];
  notifications: AppConfigServer['notifications'];
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

export interface AppConfigPersistenceDTO {
  id: string;
  version: string;
  app: string; // JSON stringified
  features: string; // JSON stringified
  limits: string; // JSON stringified
  api: string; // JSON stringified
  security: string; // JSON stringified
  notifications: string; // JSON stringified
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ AppConfig Aggregate ============

/**
 * 应用配置聚合根服务端实现
 */
export class AppConfig extends AggregateRoot<IAppConfigId> implements AppConfigServer {
  private _version: string;
  private _app: AppConfigServer['app'];
  private _features: AppConfigServer['features'];
  private _limits: AppConfigServer['limits'];
  private _api: AppConfigServer['api'];
  private _security: AppConfigServer['security'];
  private _notifications: AppConfigServer['notifications'];
  private _createdAt: DomainDate;
  private _updatedAt: DomainDate;

  private constructor(
    id: IAppConfigId,
    params: {
      version: string;
      app: AppConfigServer['app'];
      features: AppConfigServer['features'];
      limits: AppConfigServer['limits'];
      api: AppConfigServer['api'];
      security: AppConfigServer['security'];
      notifications: AppConfigServer['notifications'];
      createdAt?: DomainDate;
      updatedAt?: DomainDate;
    }
  ) {
    super(id);
    this._version = params.version;
    this._app = params.app;
    this._features = params.features;
    this._limits = params.limits;
    this._api = params.api;
    this._security = params.security;
    this._notifications = params.notifications;
    this._createdAt = params.createdAt ?? new Date();
    this._updatedAt = params.updatedAt ?? new Date();
  }

  // ========== Getters ==========

  get version(): string {
    return this._version;
  }

  get app(): AppConfigServer['app'] {
    return { ...this._app };
  }

  get features(): AppConfigServer['features'] {
    return { ...this._features };
  }

  get limits(): AppConfigServer['limits'] {
    return { ...this._limits };
  }

  get api(): AppConfigServer['api'] {
    return { ...this._api };
  }

  get security(): AppConfigServer['security'] {
    return { ...this._security };
  }

  get notifications(): AppConfigServer['notifications'] {
    return {
      ...this._notifications,
      channels: { ...this._notifications.channels },
      rateLimit: { ...this._notifications.rateLimit },
    };
  }

  get createdAt(): DomainDate {
    return this._createdAt;
  }

  get updatedAt(): DomainDate {
    return this._updatedAt;
  }

  // ========== 功能管理 ==========

  enableFeature(feature: keyof AppConfigServer['features']): void {
    this._features[feature] = true;
    this._updatedAt = new Date();
  }

  disableFeature(feature: keyof AppConfigServer['features']): void {
    this._features[feature] = false;
    this._updatedAt = new Date();
  }

  isFeatureEnabled(feature: keyof AppConfigServer['features']): boolean {
    return this._features[feature] ?? false;
  }

  // ========== 限制检查 ==========

  checkLimit(limitType: keyof AppConfigServer['limits'], currentValue: number): boolean {
    const limit = this._limits[limitType];
    return currentValue < limit;
  }

  // ========== 配置更新 ==========

  updateAppInfo(info: Partial<AppConfigServer['app']>): void {
    this._app = { ...this._app, ...info };
    this._updatedAt = new Date();
  }

  updateLimits(limits: Partial<AppConfigServer['limits']>): void {
    this._limits = { ...this._limits, ...limits };
    this._updatedAt = new Date();
  }

  updateApiConfig(config: Partial<AppConfigServer['api']>): void {
    this._api = { ...this._api, ...config };
    this._updatedAt = new Date();
  }

  updateSecurityConfig(config: Partial<AppConfigServer['security']>): void {
    this._security = { ...this._security, ...config };
    this._updatedAt = new Date();
  }

  // ========== DTO 转换 ==========

  toServerDTO(): AppConfigServerDTO {
    return {
      id: this.id,
      version: this._version,
      app: this._app,
      features: this._features,
      limits: this._limits,
      api: this._api,
      security: this._security,
      notifications: this._notifications,
      createdAt: this._createdAt.getTime() as TransferDate,
      updatedAt: this._updatedAt.getTime() as TransferDate,
    };
  }

  toPersistenceDTO(): AppConfigPersistenceDTO {
    return {
      id: this.id,
      version: this._version,
      app: JSON.stringify(this._app),
      features: JSON.stringify(this._features),
      limits: JSON.stringify(this._limits),
      api: JSON.stringify(this._api),
      security: JSON.stringify(this._security),
      notifications: JSON.stringify(this._notifications),
      createdAt: this._createdAt as PersistenceDate,
      updatedAt: this._updatedAt as PersistenceDate,
    };
  }

  // ========== 静态工厂方法 ==========

  static create(params?: Partial<Omit<AppConfigServer, 'id' | 'createdAt' | 'updatedAt'>>): AppConfig {
    const id = AppConfigId.of(AppConfigId.generate());

    // 默认配置
    const defaultApp: AppConfigServer['app'] = {
      name: 'DailyUse',
      version: '1.0.0',
      buildNumber: '1',
      environment: AppEnvironment.Development,
    };

    const defaultFeatures: AppConfigServer['features'] = {
      goals: true,
      tasks: true,
      schedules: true,
      reminders: true,
      repositories: true,
      aiAssistant: false,
      collaboration: false,
      analytics: false,
    };

    const defaultLimits: AppConfigServer['limits'] = {
      maxAccountsPerDevice: 5,
      maxGoalsPerAccount: 100,
      maxTasksPerAccount: 1000,
      maxSchedulesPerAccount: 500,
      maxRemindersPerAccount: 500,
      maxRepositoriesPerAccount: 50,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxStorageSize: 5 * 1024 * 1024 * 1024, // 5GB
    };

    const defaultApi: AppConfigServer['api'] = {
      baseUrl: 'http://localhost:3000',
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
    };

    const defaultSecurity: AppConfigServer['security'] = {
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

    const defaultNotifications: AppConfigServer['notifications'] = {
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

    const app: AppConfigServer['app'] = {
      ...defaultApp,
      ...params?.app,
    };

    return new AppConfig(id, {
      version: params?.version ?? '1.0.0',
      app,
      features: { ...defaultFeatures, ...params?.features },
      limits: { ...defaultLimits, ...params?.limits },
      api: { ...defaultApi, ...params?.api },
      security: { ...defaultSecurity, ...params?.security },
      notifications: {
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
    });
  }

  static fromServerDTO(dto: AppConfigServerDTO): AppConfig {
    const id = AppConfigId.of(dto.id);
    return new AppConfig(id, {
      version: dto.version,
      app: dto.app,
      features: dto.features,
      limits: dto.limits,
      api: dto.api,
      security: dto.security,
      notifications: dto.notifications,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  static fromPersistenceDTO(dto: AppConfigPersistenceDTO): AppConfig {
    const id = AppConfigId.of(dto.id);
    return new AppConfig(id, {
      version: dto.version,
      app: JSON.parse(dto.app),
      features: JSON.parse(dto.features),
      limits: JSON.parse(dto.limits),
      api: JSON.parse(dto.api),
      security: JSON.parse(dto.security),
      notifications: JSON.parse(dto.notifications),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}

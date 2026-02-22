/**
 * AppConfig Aggregate Root - Server Implementation
 * 应用配置聚合根 - 服务端实现
 *
 * 用于管理服务端应用级配置
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  TransferDate,
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

export interface AppConfigServerDTO {
  id: string;
  version: string;
  app: AppConfigState['app'];
  features: AppConfigState['features'];
  limits: AppConfigState['limits'];
  api: AppConfigState['api'];
  security: AppConfigState['security'];
  notifications: AppConfigState['notifications'];
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/** Domain state for AppConfig */
export interface AppConfigState {
  id: IAppConfigId;
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

// ============ AppConfig Aggregate ============

/**
 * 应用配置聚合根服务端实现
 */
export class AppConfig extends AggregateRoot<IAppConfigId> {
  // ===== 私有属性容器 =====
  private _props: Omit<AppConfigState, 'id'>;

  private constructor(state: AppConfigState) {
    super(state.id);
    this._props = {
      version: state.version,
      app: state.app,
      features: state.features,
      limits: state.limits,
      api: state.api,
      security: state.security,
      notifications: state.notifications,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    };
  }

  // ========== Getters ==========

  get version(): string {
    return this._props.version;
  }

  get app(): AppConfigState['app'] {
    return { ...this._props.app };
  }

  get features(): AppConfigState['features'] {
    return { ...this._props.features };
  }

  get limits(): AppConfigState['limits'] {
    return { ...this._props.limits };
  }

  get api(): AppConfigState['api'] {
    return { ...this._props.api };
  }

  get security(): AppConfigState['security'] {
    return { ...this._props.security };
  }

  get notifications(): AppConfigState['notifications'] {
    return {
      ...this._props.notifications,
      channels: { ...this._props.notifications.channels },
      rateLimit: { ...this._props.notifications.rateLimit },
    };
  }

  get createdAt(): DomainDate {
    return this._props.createdAt;
  }

  get updatedAt(): DomainDate {
    return this._props.updatedAt;
  }

  // ========== 功能管理 ==========

  enableFeature(feature: keyof AppConfigState['features']): void {
    this._props.features[feature] = true;
    this._props.updatedAt = new Date();
  }

  disableFeature(feature: keyof AppConfigState['features']): void {
    this._props.features[feature] = false;
    this._props.updatedAt = new Date();
  }

  isFeatureEnabled(feature: keyof AppConfigState['features']): boolean {
    return this._props.features[feature] ?? false;
  }

  // ========== 限制检查 ==========

  checkLimit(limitType: keyof AppConfigState['limits'], currentValue: number): boolean {
    const limit = this._props.limits[limitType];
    return currentValue < limit;
  }

  // ========== 配置更新 ==========

  updateAppInfo(info: Partial<AppConfigState['app']>): void {
    this._props.app = { ...this._props.app, ...info };
    this._props.updatedAt = new Date();
  }

  updateLimits(limits: Partial<AppConfigState['limits']>): void {
    this._props.limits = { ...this._props.limits, ...limits };
    this._props.updatedAt = new Date();
  }

  updateApiConfig(config: Partial<AppConfigState['api']>): void {
    this._props.api = { ...this._props.api, ...config };
    this._props.updatedAt = new Date();
  }

  updateSecurityConfig(config: Partial<AppConfigState['security']>): void {
    this._props.security = { ...this._props.security, ...config };
    this._props.updatedAt = new Date();
  }

  // ========== DTO 转换 ==========

  toServerDTO(): AppConfigServerDTO {
    return {
      id: this.id,
      version: this._props.version,
      app: this._props.app,
      features: this._props.features,
      limits: this._props.limits,
      api: this._props.api,
      security: this._props.security,
      notifications: this._props.notifications,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
    };
  }

  // ========== 静态工厂方法 ==========

  /**
   * Reconstruct from persisted state
   */
  static load(state: AppConfigState): AppConfig {
    return new AppConfig(state);
  }

  static create(params?: Partial<Omit<AppConfigState, 'id' | 'createdAt' | 'updatedAt'>>): AppConfig {
    const id = AppConfigId.of(AppConfigId.generate());

    // 默认配置
    const defaultApp: AppConfigState['app'] = {
      name: 'DailyUse',
      version: '1.0.0',
      buildNumber: '1',
      environment: AppEnvironment.Development,
    };

    const defaultFeatures: AppConfigState['features'] = {
      goals: true,
      tasks: true,
      schedules: true,
      reminders: true,
      repositories: true,
      aiAssistant: false,
      collaboration: false,
      analytics: false,
    };

    const defaultLimits: AppConfigState['limits'] = {
      maxAccountsPerDevice: 5,
      maxGoalsPerAccount: 100,
      maxTasksPerAccount: 1000,
      maxSchedulesPerAccount: 500,
      maxRemindersPerAccount: 500,
      maxRepositoriesPerAccount: 50,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxStorageSize: 5 * 1024 * 1024 * 1024, // 5GB
    };

    const defaultApi: AppConfigState['api'] = {
      baseUrl: 'http://localhost:3000',
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
    };

    const defaultSecurity: AppConfigState['security'] = {
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

    const defaultNotifications: AppConfigState['notifications'] = {
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

    const app: AppConfigState['app'] = {
      ...defaultApp,
      ...params?.app,
    };

    return new AppConfig({
      id,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

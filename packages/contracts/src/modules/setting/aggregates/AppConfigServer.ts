/**
 * AppConfig Aggregate Root - Server Interface
 * 应用配置聚合根 - 服务端接口
 */

import type { AppConfigClientDTO } from './AppConfigClient';

// ============ DTO 定义 ============

/**
 * AppConfig Server DTO
 */
export interface AppConfigServerDTO {
  uuid: string;
  version: string;
  app: {
    name: string;
    version: string;
    buildNumber: string;
    environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AppConfig Persistence DTO
 */
export interface AppConfigPersistenceDTO {
  uuid: string;
  version: string;
  app: string; // JSON
  features: string; // JSON
  limits: string; // JSON
  api: string; // JSON
  security: string; // JSON
  notifications: string; // JSON
  createdAt: Date;
  updatedAt: Date;
}

// ============ 聚合根接口 ============

export interface AppConfigServer {
  uuid: string;
  version: string;
  app: {
    name: string;
    version: string;
    buildNumber: string;
    environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
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
  createdAt: Date;
  updatedAt: Date;

  // 功能管理
  enableFeature(feature: string): void;
  disableFeature(feature: string): void;
  isFeatureEnabled(feature: string): boolean;

  // 限制检查
  checkLimit(limitType: string, currentValue: number): boolean;

  // 配置更新
  updateAppInfo(info: Partial<AppConfigServer['app']>): void;
  updateLimits(limits: Partial<AppConfigServer['limits']>): void;
  updateApiConfig(config: Partial<AppConfigServer['api']>): void;
  updateSecurityConfig(config: Partial<AppConfigServer['security']>): void;}

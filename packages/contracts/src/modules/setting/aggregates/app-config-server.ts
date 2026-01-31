/**
 * AppConfig Aggregate Root - Server Interface
 * 应用配置聚合�?- 服务端接�?
 */

import type { AppConfigId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { AppConfigClientDTO } from './app-config-client';

// ============ DTO 定义 ============

/**
 * AppConfig Server DTO
 */
export interface AppConfigServerDTO {
  id: string;
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
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * AppConfig Persistence DTO
 */
export interface AppConfigPersistenceDTO {
  id: string;
  version: string;
  app: string; // JSON
  features: string; // JSON
  limits: string; // JSON
  api: string; // JSON
  security: string; // JSON
  notifications: string; // JSON
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ 聚合根接�?============

export interface AppConfigServer {
  id: AppConfigId;
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
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // 功能管理

  // 限制检�?

  // 配置更新
}

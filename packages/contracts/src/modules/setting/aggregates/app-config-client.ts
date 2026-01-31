/**
 * AppConfig Aggregate Root - Client Interface
 * 应用配置聚合�?- 客户端接�?
 */

import type { AppConfigId, TransferDate, DomainDate } from '@/primitives';
import type { AppConfigServerDTO } from './app-config-server';

// ============ DTO 定义 ============

/**
 * AppConfig Client DTO
 */
export interface AppConfigClientDTO {
  id: string;
  version: string;
  app: {
    name: string;
    version: string;
    buildNumber: string;
    environment: string;
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
  createdAt: TransferDate;
  updatedAt: TransferDate;
  appVersionText: string;
  environmentText: string;
  enabledFeaturesCount: number;
}

// ============ 聚合根接�?============

export interface AppConfigClient {
  id: AppConfigId;
  version: string;
  app: {
    name: string;
    version: string;
    buildNumber: string;
    environment: string;
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
  createdAt: DomainDate;
  updatedAt: DomainDate;
  appVersionText: string;
  environmentText: string;
  enabledFeaturesCount: number;

  // UI 方法
}

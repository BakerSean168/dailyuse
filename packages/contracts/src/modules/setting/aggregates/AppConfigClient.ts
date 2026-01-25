/**
 * AppConfig Aggregate Root - Client Interface
 * 应用配置聚合根 - 客户端接口
 */

import type { AppConfigServerDTO } from './AppConfigServer';

// ============ DTO 定义 ============

/**
 * AppConfig Client DTO
 */
export interface AppConfigClientDTO {
  uuid: string;
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
  createdAt: number;
  updatedAt: number;
  appVersionText: string;
  environmentText: string;
  enabledFeaturesCount: number;
}

// ============ 聚合根接口 ============

export interface AppConfigClient {
  uuid: string;
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
  createdAt: Date;
  updatedAt: Date;
  appVersionText: string;
  environmentText: string;
  enabledFeaturesCount: number;

  // UI 方法
  getAppVersionText(): string;
  getEnvironmentBadge(): { text: string; color: string };
  getEnabledFeatures(): string[];
  isFeatureEnabled(feature: string): boolean;
  canCreateGoal(currentCount: number): boolean;
  canCreateTask(currentCount: number): boolean;
  canUploadFile(fileSize: number): boolean;

  toServerDTO(): AppConfigServerDTO;
}

export interface AppConfigClientStatic {
  create(params?: Partial<AppConfigClient>): AppConfigClient;
  fromServerDTO(dto: AppConfigServerDTO): AppConfigClient;
  fromClientDTO(dto: AppConfigClientDTO): AppConfigClient;
}

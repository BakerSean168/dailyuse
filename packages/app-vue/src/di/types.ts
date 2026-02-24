/**
 * DI Type Definitions
 *
 * 定义 app-vue 注入键所使用的服务接口类型。
 *
 * 策略：直接从各领域包的 application-client 导入真实的 Service 类/接口，
 * 这样 composables 在 inject() 后能获得完整的方法签名和类型安全。
 *
 * 对于 governance (Rule) 模块，DI 直接注入的是 IRuleApiClient（而非封装 Service），
 * 因此使用 contracts 中的接口类型。
 */

import type { Component } from 'vue';

// ── Service Classes ──
export type { AccountClientService as IAccountService } from '@dailyuse/account/application-client';
export type { AuthClientService as IAuthService } from '@dailyuse/authentication/application-client';
export type { GoalClientService as IGoalService } from '@dailyuse/goal/application-client';
export type { TaskClientService as ITaskService } from '@dailyuse/task/application-client';
export type { ScheduleClientService as IScheduleService } from '@dailyuse/schedule/application-client';
export type { ReminderClientService as IReminderService } from '@dailyuse/reminder/application-client';
export type { RepositoryClientService as IRepositoryService } from '@dailyuse/repository/application-client';
export type { NotificationClientService as INotificationService } from '@dailyuse/notification/application-client';
export type { SettingClientService as ISettingService } from '@dailyuse/setting/application-client';

// ── Governance 使用原始 API Client 接口 ──
export type { IRuleApiClient as IRuleService } from '@dailyuse/governance/infrastructure-client';

// ── Navigation ──
export interface NavigationItem {
  path: string;
  title: string;
  icon?: Component;
}

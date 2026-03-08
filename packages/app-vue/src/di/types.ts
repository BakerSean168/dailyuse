/**
 * DI Type Definitions
 *
 * 定义 app-vue 注入键所使用的服务接口类型。
 *
 * 策略：使用 `{ [K in keyof import('...').Class]: ... }` 内联映射类型，
 * 将 Service 类映射为只含公有成员的结构化接口。这同时解决两个问题：
 *
 * 1. **Private nominal typing** — class 的 private 字段导致 source 与 dist 解析
 *    出两个不兼容的类型身份。mapped type 的 `keyof` 只遍历 public 成员，
 *    产出纯 structural 类型，彻底消除 nominal 冲突。
 *
 * 2. **rootDir 违规** — 若使用顶层 `import type { X } from '@dailyuse/xxx'`，
 *    vite-plugin-dts 生成 .d.ts 时会沿 tsconfig paths 追踪到外部包源码目录，
 *    违反 `rootDir: "./src"`。内联 `import()` 类型表达式不触发此行为。
 *
 * 对于 governance (Rule) 模块，DI 直接注入的是 IRuleApiClient（纯接口，无 private），
 * 直接 re-export 即可。
 */

import type { Component } from 'vue';

/**
 * Maps a class type to a structural interface containing only its public members.
 * `keyof` only enumerates public properties, stripping private/protected fields.
 */
type PublicInterface<T> = { [K in keyof T]: T[K] };

// ── Service Interfaces (structural, no private members) ──

export type IAccountService = PublicInterface<
  import('@dailyuse/account/application-client').AccountClientService
>;
export type IAuthService = PublicInterface<
  import('@dailyuse/authentication/application-client').AuthClientService
>;
export type IGoalService = PublicInterface<
  import('@dailyuse/goal/application-client').GoalClientService
>;
export type ITaskService = PublicInterface<
  import('@dailyuse/task/application-client').TaskClientService
>;
export type IScheduleService = PublicInterface<
  import('@dailyuse/schedule/application-client').ScheduleClientService
>;
export type IReminderService = PublicInterface<
  import('@dailyuse/reminder/application-client').ReminderClientService
>;
export type IRepositoryService = PublicInterface<
  import('@dailyuse/repository/application-client').RepositoryClientService
>;
export type INotificationService = PublicInterface<
  import('@dailyuse/notification/application-client').NotificationClientService
>;
export type ISettingService = PublicInterface<
  import('@dailyuse/setting/application-client').SettingClientService
>;
export interface IAIService {
  createProvider(request: unknown): Promise<unknown>;
  updateProvider(id: string, request: unknown): Promise<unknown>;
  listProviders(): Promise<unknown>;
  getProvider(id: string): Promise<unknown>;
  deleteProvider(id: string): Promise<void>;
  testProvider(request: unknown): Promise<unknown>;
  setDefaultProvider(providerId: string): Promise<void>;
  generateGoal(request: unknown): Promise<unknown>;
  createConversation(request: unknown): Promise<unknown>;
  listConversations(params?: { page?: number; pageSize?: number }): Promise<unknown>;
  getConversation(id: string): Promise<unknown>;
  deleteConversation(id: string): Promise<void>;
  sendMessage(request: unknown): Promise<unknown>;
  listMessages(
    conversationId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<unknown>;
  createKnowledgeNote(request: unknown): Promise<unknown>;
}

// ── Governance（纯接口，无 private）──
export type { IRuleApiClient as IRuleService } from '@dailyuse/governance/infrastructure-client';

// ── Dashboard（纯接口，无 private）──
export type { IDashboardApiClient as IDashboardService } from '../modules/dashboard/types';

// ── Navigation ──
export interface NavigationItem {
  path: string;
  title: string;
  icon?: Component;
}

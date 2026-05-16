/**
 * DI Type Definitions
 *
 * 定义 app-vue 注入键所使用的服务接口类型。
 *
 * 策略：
 *
 * 1. Goal / Task / AI 使用各模块显式导出的 `*ClientPort` public interface，
 *    避免引用具体 service class 触发 private nominal typing。
 * 2. application-client 的类型解析走依赖包 `dist/*.d.ts`，避免 app-vue 的 d.ts 生成
 *    追踪到外部源码目录并触发 `rootDir: "./src"` 违规。
 * 3. governance 仍使用结构化 service interface，因为当前依赖包只对 app-vue 暴露
 *    build 产物类型。
 */

import type { AIClientPort } from '@dailyuse/ai/application-client';
import type { GoalClientPort } from '@dailyuse/goal/application-client';
import type { TaskClientPort } from '@dailyuse/task/application-client';
import type { Component } from 'vue';

/**
 * Maps a class type to a structural interface containing only its public members.
 * `keyof` only enumerates public properties, stripping private/protected fields.
 */
type PublicInterface<T> = { [K in keyof T]: T[K] };

// ── Service Interfaces (structural, no private members) ──

export type IAccountService = PublicInterface<any>;
export type IAuthService = PublicInterface<any>;
export type IGoalService = GoalClientPort;
export type ITaskService = TaskClientPort;
export type IScheduleService = PublicInterface<any>;
export type IReminderService = PublicInterface<any>;
export type IRepositoryService = PublicInterface<any>;
export type IEditorService = PublicInterface<any>;
export type INotificationService = PublicInterface<any>;
export type ISettingService = PublicInterface<any>;
export type IAIService = AIClientPort;

// ── Governance（结构化 service interface）──
export type IRuleService = PublicInterface<
  import('@dailyuse/governance/application-client').GovernanceClientService
>;

// ── Dashboard（纯接口，无 private）──
export type { IDashboardApiClient as IDashboardService } from '../modules/dashboard/types';

// ── Navigation ──
export interface NavigationItem {
  path: string;
  title: string;
  icon?: Component;
}

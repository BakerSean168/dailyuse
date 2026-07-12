/**
 * DI Type Definitions
 *
 * 定义 app-vue 注入键所使用的服务接口类型。
 *
 * 策略：
 *
 * 1. Goal / Task / AI 使用各模块显式导出的 `*ClientPort` public interface，
 *    避免引用具体 service class 触发 private nominal typing。
 * 2. client seam 的类型解析走依赖包 `dist/*.d.ts`，避免 app-vue 的 d.ts 生成
 *    追踪到外部源码目录并触发 `rootDir: "./src"` 违规。
 */

import type { AccountClientPort } from '@dailyuse/account/client';
import type { AIClientPort } from '@dailyuse/ai/client';
import type { AuthenticationClientPort } from '@dailyuse/authentication/client';
import type { GovernanceClientPort } from '@dailyuse/governance/client';
import type { EditorClientPort } from '@dailyuse/editor/client';
import type { GoalClientPort } from '@dailyuse/goal/client';
import type { NotificationClientPort } from '@dailyuse/notification/client';
import type { ReminderClientPort } from '@dailyuse/reminder/client';
import type { RepositoryClientPort } from '@dailyuse/repository/client';
import type { ScheduleClientPort } from '@dailyuse/schedule/client';
import type { SettingClientPort } from '@dailyuse/setting/client';
import type { TaskClientPort } from '@dailyuse/task/client';
import type { DataPortabilityClientPort } from '@dailyuse/data-portability/client';
import type { Component } from 'vue';

// ── Service Interfaces (structural, no private members) ──

export type IAccountService = AccountClientPort;
export type IAuthService = AuthenticationClientPort;
export type IGoalService = GoalClientPort;
export type ITaskService = TaskClientPort;
export type IScheduleService = ScheduleClientPort;
export type IReminderService = ReminderClientPort;
export type IRepositoryService = RepositoryClientPort;
export type IEditorService = EditorClientPort;
export type INotificationService = NotificationClientPort;
export type ISettingService = SettingClientPort;
export type IDataPortabilityService = DataPortabilityClientPort;
export type IAIService = AIClientPort;
export type IRuleService = GovernanceClientPort;

// ── Dashboard（纯接口，无 private）──
export type { IDashboardApiClient as IDashboardService } from '../modules/dashboard/types';

// ── Navigation ──
export interface NavigationItem {
  path: string;
  /** i18n key for the item label (e.g. 'nav.home'). */
  title: string;
  /**
   * i18n key of the navigation group this item belongs to
   * (e.g. 'nav.group.workbench'). Items sharing the same group render
   * under one group label, in array order. Ungrouped items render first.
   */
  group?: string;
  /** Icon component (lucide-vue-next), rendered before the label. */
  icon?: Component;
  /**
   * Semantic badge token resolved by the layout (reserved; e.g. an
   * unread-count source). Currently unused by the default layout.
   */
  badge?: string;
}

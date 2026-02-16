/**
 * Electron IPC Type Declarations
 * 
 * 定义 window.electron 接口，用于渲染进程与主进程通信
 * 
 * 注意：这是一个 placeholder 类型文件。
 * 实际的 IPC 处理器将在各个模块的 Story 中实现。
 * 
 * @module renderer/types/electron
 */

import type { GoalClientDTO, GoalFolderClientDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';
import type { ScheduleClientDTO, CreateScheduleRequest, UpdateScheduleRequest } from '@dailyuse/contracts/schedule';
import type { AccountDTO, SubscriptionDTO, AccountHistoryServerDTO, AccountStatsResponseDTO } from '@dailyuse/contracts/account';
import type { RepositoryClientDTO, ResourceClientDTO, FolderClientDTO } from '@dailyuse/contracts/repository';

/**
 * Goal IPC Interface
 */
interface GoalIPC {
  getAll(): Promise<GoalClientDTO[]>;
  getById(id: string): Promise<GoalClientDTO | null>;
  create(dto: CreateGoalRequest): Promise<GoalClientDTO>;
  update(id: string, dto: UpdateGoalRequest): Promise<GoalClientDTO>;
  delete(id: string): Promise<void>;
  getFolders(): Promise<GoalFolderClientDTO[]>;
  moveToFolder(goalId: string, folderId: string | null): Promise<void>;
}

/**
 * Task IPC Interface - Placeholder
 */
interface TaskIPC {
  // 将在 Story 11-2 中实现
  getInstances(params: { startDate: number; endDate: number }): Promise<unknown[]>;
  getTemplates(): Promise<unknown[]>;
  completeInstance(id: string): Promise<unknown>;
  skipInstance(id: string, params?: { reason?: string }): Promise<unknown>;
}

/**
 * Reminder IPC Interface - Placeholder
 */
interface ReminderIPC {
  // 将在 Story 11-3 中实现
  getTemplates(): Promise<unknown[]>;
  getGroups(): Promise<unknown[]>;
  snooze(id: string, minutes: number): Promise<void>;
  dismiss(id: string): Promise<void>;
  toggleEnabled(id: string): Promise<unknown>;
}

/**
 * Schedule IPC Interface
 */
interface ScheduleIPC {
  getByDateRange(start: Date, end: Date): Promise<ScheduleClientDTO[]>;
  getAll(params: { startDate: number; endDate: number }): Promise<ScheduleClientDTO[]>;
  create(dto: CreateScheduleRequest): Promise<ScheduleClientDTO>;
  update(id: string, dto: UpdateScheduleRequest): Promise<ScheduleClientDTO>;
  delete(id: string): Promise<void>;
}

/**
 * AI IPC Interface - Placeholder
 */
interface AIIPC {
  // 将在 Story 11-6 中实现
  chat(conversationId: string | undefined, content: string): Promise<string>;
  chatWithMessages(params: { messages: unknown[]; conversationId?: string }): Promise<unknown>;
  getConversations(): Promise<unknown[]>;
  deleteConversation(id: string): Promise<void>;
}

/**
 * Settings IPC Interface - Placeholder
 */
interface SettingsIPC {
  // 将在 Story 11-6 中实现
  get(): Promise<unknown>;
  getAll(): Promise<unknown>;
  update(settings: unknown): Promise<unknown>;
  save(settings: unknown): Promise<void>;
  getShortcuts(): Promise<unknown[]>;
  setShortcut(id: string, keys: string[]): Promise<unknown>;
}

/**
 * Auth IPC Interface - Placeholder
 */
interface AuthIPC {
  // 将在 Story 11-6 中实现
  login(email: string, password: string): Promise<{ user: AuthUser; token: string }>;
  register(params: { email: string; password: string; name: string }): Promise<{ user: AuthUser; token: string }>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  refreshToken(): Promise<{ token: string }>;
  checkAuth(token: string): Promise<AuthUser | null>;
}

/**
 * Auth User type
 */
interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

/**
 * Account IPC Interface - Placeholder
 */
interface AccountIPC {
  // 将在后续 Story 中实现
  getCurrent(): Promise<AccountDTO | null>;
  getSubscription(): Promise<SubscriptionDTO | null>;
  getHistory(): Promise<AccountHistoryServerDTO[]>;
  getStats(): Promise<AccountStatsResponseDTO>;
}

/**
 * Repository IPC Interface - Placeholder
 */
interface RepositoryIPC {
  // 将在后续 Story 中实现
  getAll(): Promise<RepositoryClientDTO[]>;
  getResources(repositoryId: string): Promise<ResourceClientDTO[]>;
  getFolders(repositoryId: string): Promise<FolderClientDTO[]>;
  search(query: string): Promise<ResourceClientDTO[]>;
}

/**
 * Main Electron IPC Interface
 */
export interface ElectronAPI {
  goal: GoalIPC;
  task: TaskIPC;
  reminder: ReminderIPC;
  schedule: ScheduleIPC;
  ai: AIIPC;
  settings: SettingsIPC;
  setting: SettingsIPC; // Alias for settings
  auth: AuthIPC;
  account: AccountIPC;
  repository: RepositoryIPC;
}

/**
 * Extend Window interface with electron property
 */
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};

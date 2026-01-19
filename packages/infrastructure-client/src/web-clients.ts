/**
 * Web Clients Instances
 *
 * 为 Web 应用导出所有初始化的基础设施客户端实例
 * 这些实例是通过容器模式获取的，确保单例和依赖注入
 *
 * 使用方式：
 * import { getAccountApiClient, getReminderApiClient } from '@dailyuse/infrastructure-client/web-clients';
 */

import { AccountContainer, type IAccountApiClient } from './account';
import { ReminderContainer, type IReminderApiClient } from './reminder';
import {
  AIContainer,
  type IAIProviderConfigApiClient,
  type IAIConversationApiClient,
  type IAIMessageApiClient,
} from './ai';
import {
  TaskContainer,
  type ITaskTemplateApiClient,
  type ITaskInstanceApiClient,
  type ITaskDependencyApiClient,
} from './task';
import { GoalContainer, type IGoalApiClient } from './goal';
import { RepositoryContainer, type IRepositoryApiClient } from './repository';

/**
 * 获取 Account API 客户端实例
 */
export function getAccountApiClient(): IAccountApiClient {
  return AccountContainer.getInstance().getApiClient();
}

/**
 * 获取 Reminder API 客户端实例
 */
export function getReminderApiClient(): IReminderApiClient {
  return ReminderContainer.getInstance().getApiClient();
}

/**
 * 获取 AI Provider Config API 客户端实例
 */
export function getAIProviderConfigApiClient(): IAIProviderConfigApiClient {
  return AIContainer.getInstance().getProviderConfigApiClient();
}

/**
 * 获取 AI Conversation API 客户端实例
 */
export function getAIConversationApiClient(): IAIConversationApiClient {
  return AIContainer.getInstance().getConversationApiClient();
}

/**
 * 获取 AI Message API 客户端实例
 */
export function getAIMessageApiClient(): IAIMessageApiClient {
  return AIContainer.getInstance().getMessageApiClient();
}

/**
 * 获取 Task Template API 客户端实例
 */
export function getTaskTemplateApiClient(): ITaskTemplateApiClient {
  return TaskContainer.getInstance().getTemplateApiClient();
}

/**
 * 获取 Task Instance API 客户端实例
 */
export function getTaskInstanceApiClient(): ITaskInstanceApiClient {
  return TaskContainer.getInstance().getInstanceApiClient();
}

/**
 * 获取 Task Dependency API 客户端实例
 */
export function getTaskDependencyApiClient(): ITaskDependencyApiClient {
  return TaskContainer.getInstance().getDependencyApiClient();
}

/**
 * 获取 Goal API 客户端实例
 */
export function getGoalApiClient(): IGoalApiClient {
  return GoalContainer.getInstance().getApiClient();
}

/**
 * 获取 Repository API 客户端实例
 */
export function getRepositoryApiClient(): IRepositoryApiClient {
  return RepositoryContainer.getInstance().getApiClient();
}

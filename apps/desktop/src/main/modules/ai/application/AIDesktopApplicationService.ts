/**
 * AI Desktop Application Service - Facade Pattern
 *
 * 包装 @dailyuse/ai/application-server 的所有 Use Cases
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 * 
 * 所有具体的业务逻辑都委托给 services 文件夹中的专门服务
 */

import {
  createConversationService,
  listConversationsService,
  getConversationService,
  deleteConversationService,
  updateConversationService,
  archiveConversationService,
  searchConversationsService,
  sendMessageService,
  listMessagesService,
  getMessageService,
  deleteMessageService,
  regenerateMessageService,
  editMessageService,
  messageFeedbackService,
  createGenerationTaskService,
  listGenerationTasksService,
  getGenerationTaskService,
  cancelGenerationTaskService,
  retryGenerationTaskService,
  getGenerationTaskStatusService,
  generateGoalService,
  getQuotaService,
  getUsageHistoryService,
  getQuotaByModelService,
  listProvidersService,
  getProviderService,
  getProviderModelsService,
  setDefaultProviderService,
  configureProviderService,
  testProviderConnectionService,
} from './services';

import type {
  CreateConversationRequest,
  ConversationResponse,
  ConversationListResponse,
  SendMessageRequest,
  MessageResponse,
  QuotaResponse,
  GenerateGoalRequest,
  GenerateGoalResponse,
  ListRequest,
  AIConversationClientDTO,
  MessageClientDTO,
  AIUsageQuotaClientDTO,
  AIProviderConfigClientDTO,
} from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIDesktopAppService');

export class AIDesktopApplicationService {
  constructor() {
    // Container should be initialized by infrastructure module
  }

  // ===== Conversation =====

  async createConversation(
    accountUuid: string,
    title?: string,
  ): Promise<ConversationResponse> {
    return createConversationService(accountUuid, title);
  }

  async listConversations(
    accountUuid: string,
    options?: { limit?: number; offset?: number; archived?: boolean },
  ): Promise<ConversationListResponse> {
    return listConversationsService(accountUuid, options);
  }

  async getConversation(
    accountUuid: string,
    conversationUuid: string,
    includeMessages = false,
  ): Promise<ConversationResponse> {
    return getConversationService(accountUuid, conversationUuid, includeMessages);
  }

  async deleteConversation(
    accountUuid: string,
    conversationUuid: string,
  ): Promise<void> {
    return deleteConversationService(accountUuid, conversationUuid);
  }

  async updateConversation(
    accountUuid: string,
    conversationUuid: string,
    updates: { title?: string; archived?: boolean },
  ): Promise<AIConversationClientDTO | null> {
    return updateConversationService(accountUuid, conversationUuid, updates);
  }

  async archiveConversation(
    accountUuid: string,
    conversationUuid: string,
  ): Promise<{ success: boolean }> {
    return archiveConversationService(accountUuid, conversationUuid);
  }

  async searchConversations(
    accountUuid: string,
    query: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ conversations: AIConversationClientDTO[]; total: number }> {
    return searchConversationsService(accountUuid, query, options);
  }

  // ===== Message =====

  async sendMessage(
    accountUuid: string,
    conversationUuid: string,
    content: string,
  ): Promise<MessageResponse> {
    return sendMessageService(accountUuid, conversationUuid, content);
  }

  async listMessages(
    accountUuid: string,
    conversationUuid: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ messages: MessageClientDTO[]; total: number }> {
    return listMessagesService(accountUuid, conversationUuid, options);
  }

  async getMessage(
    accountUuid: string,
    messageUuid: string,
  ): Promise<MessageClientDTO | null> {
    return getMessageService(accountUuid, messageUuid);
  }

  async deleteMessage(
    accountUuid: string,
    messageUuid: string,
  ): Promise<{ success: boolean }> {
    return deleteMessageService(accountUuid, messageUuid);
  }

  async regenerateMessage(
    accountUuid: string,
    messageUuid: string,
  ): Promise<{ uuid: string }> {
    return regenerateMessageService(accountUuid, messageUuid);
  }

  async editMessage(
    accountUuid: string,
    messageUuid: string,
    content: string,
  ): Promise<{ success: boolean }> {
    return editMessageService(accountUuid, messageUuid, content);
  }

  async messageFeedback(
    accountUuid: string,
    messageUuid: string,
    feedback: 'positive' | 'negative',
  ): Promise<{ success: boolean }> {
    return messageFeedbackService(accountUuid, messageUuid, feedback);
  }

  // ===== Generation Task =====

  async createGenerationTask(
    accountUuid: string,
    request: { type: string; input: any },
  ): Promise<{ uuid: string; status: string }> {
    return createGenerationTaskService(accountUuid, request);
  }

  async listGenerationTasks(
    accountUuid: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ tasks: any[]; total: number }> {
    return listGenerationTasksService(accountUuid, options);
  }

  async getGenerationTask(
    accountUuid: string,
    taskUuid: string,
  ): Promise<any | null> {
    return getGenerationTaskService(accountUuid, taskUuid);
  }

  async cancelGenerationTask(
    accountUuid: string,
    taskUuid: string,
  ): Promise<{ success: boolean }> {
    return cancelGenerationTaskService(accountUuid, taskUuid);
  }

  async retryGenerationTask(
    accountUuid: string,
    taskUuid: string,
  ): Promise<{ success: boolean }> {
    return retryGenerationTaskService(accountUuid, taskUuid);
  }

  async getGenerationTaskStatus(
    accountUuid: string,
    taskUuid: string,
  ): Promise<{ status: string; progress: number }> {
    return getGenerationTaskStatusService(accountUuid, taskUuid);
  }

  // ===== Goal Generation =====

  async generateGoal(
    accountUuid: string,
    input: Omit<GenerateGoalRequest, 'accountUuid'>,
  ): Promise<GenerateGoalResponse> {
    return generateGoalService(accountUuid, input);
  }

  // ===== Quota =====

  async getQuota(accountUuid: string): Promise<QuotaResponse> {
    return getQuotaService(accountUuid);
  }

  async getUsageHistory(
    accountUuid: string,
    options?: { startDate?: Date; endDate?: Date },
  ): Promise<{ usages: any[]; total: number }> {
    return getUsageHistoryService(accountUuid, options);
  }

  async getQuotaByModel(
    accountUuid: string,
    modelId: string,
  ): Promise<{ used: number; limit: number }> {
    return getQuotaByModelService(accountUuid, modelId);
  }

  // ===== Provider =====

  async listProviders(accountUuid: string): Promise<{ providers: AIProviderConfigClientDTO[] }> {
    return listProvidersService(accountUuid);
  }

  async getProvider(
    accountUuid: string,
    providerId: string,
  ): Promise<AIProviderConfigClientDTO | null> {
    return getProviderService(accountUuid, providerId);
  }

  async getProviderModels(
    accountUuid: string,
    providerId: string,
  ): Promise<{ models: any[] }> {
    return getProviderModelsService(accountUuid, providerId);
  }

  async setDefaultProvider(
    accountUuid: string,
    providerId: string,
  ): Promise<{ success: boolean }> {
    return setDefaultProviderService(accountUuid, providerId);
  }

  async configureProvider(
    accountUuid: string,
    providerId: string,
    config: any,
  ): Promise<{ success: boolean }> {
    return configureProviderService(accountUuid, providerId, config);
  }

  async testProviderConnection(
    accountUuid: string,
    providerId: string,
  ): Promise<{ success: boolean; latency: number }> {
    return testProviderConnectionService(accountUuid, providerId);
  }
}

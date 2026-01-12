/**
 * AI Application Service - Renderer
 *
 * AI 模块应用服务层
 * 封装 @dailyuse/application-client 的 AI Use Cases
 */

import {
  // Conversation
  CreateConversation,
  ListConversations,
  GetConversation,
  UpdateConversation,
  DeleteConversation,
  CloseConversation,
  ArchiveConversation,
  // Message
  SendMessage,
  ListMessages,
  DeleteMessage,
  StreamChat,
  // Generation
  GenerateGoal,
  GenerateGoalWithKeyResults,
  AIGenerateKeyResults,
  // Quota
  GetQuota,
  CheckQuotaAvailability,
  // Provider
  ListProviders,
  CreateProvider,
  TestProviderConnection,
  SetDefaultProvider,
} from '@dailyuse/application-client';

import type {
  CreateConversationRequest,
  UpdateConversationRequest,
  SendMessageRequest,
  ChatStreamRequest,
  GenerateGoalRequest,
  GenerateGoalWithKRsRequest,
  CreateAIProviderRequest,
  TestAIProviderConnectionRequest,
  UpdateAIProviderRequest,
} from '@dailyuse/contracts/ai';
import { AIContainer } from '@dailyuse/infrastructure-client';

/**
 * AI 应用服务
 *
 * 提供 AI 相关的所有业务操作
 * 返回类型与 @dailyuse/application-client 保持一致
 */
export class AIApplicationService {
  // ===== Conversation Operations =====

  /**
   * 创建对话
   */
  createConversation(input: CreateConversationRequest) {
    return CreateConversation.getInstance().execute(input);
  }

  /**
   * 获取对话列表
   */
  listConversations(input?: { page?: number; pageSize?: number; status?: string }) {
    return ListConversations.getInstance().execute(input);
  }

  /**
   * 获取单个对话
   */
  getConversation(conversationUuid: string) {
    return GetConversation.getInstance().execute(conversationUuid);
  }

  /**
   * 更新对话
   */
  updateConversation(conversationUuid: string, request: UpdateConversationRequest) {
    return UpdateConversation.getInstance().execute(conversationUuid, request);
  }

  /**
   * 删除对话
   */
  deleteConversation(conversationUuid: string) {
    return DeleteConversation.getInstance().execute(conversationUuid);
  }

  /**
   * 关闭对话
   */
  closeConversation(conversationUuid: string) {
    return CloseConversation.getInstance().execute(conversationUuid);
  }

  /**
   * 归档对话
   */
  archiveConversation(conversationUuid: string) {
    return ArchiveConversation.getInstance().execute(conversationUuid);
  }

  // ===== Message Operations =====

  /**
   * 发送消息
   */
  sendMessage(input: SendMessageRequest) {
    return SendMessage.getInstance().execute(input);
  }

  /**
   * 获取消息列表
   */
  listMessages(conversationUuid: string, params?: { page?: number; pageSize?: number }) {
    return ListMessages.getInstance().execute(conversationUuid, params);
  }

  /**
   * 删除消息
   */
  deleteMessage(messageUuid: string) {
    return DeleteMessage.getInstance().execute(messageUuid);
  }

  /**
   * 流式聊天
   */
  streamChat(input: ChatStreamRequest) {
    return StreamChat.getInstance().execute(input);
  }

  // ===== Generation Operations =====

  /**
   * 生成目标
   */
  generateGoal(input: GenerateGoalRequest) {
    return GenerateGoal.getInstance().execute(input);
  }

  /**
   * 生成目标和关键结果
   */
  generateGoalWithKeyResults(input: GenerateGoalWithKRsRequest) {
    return GenerateGoalWithKeyResults.getInstance().execute(input);
  }

  /**
   * 生成关键结果
   */
  generateKeyResults(goalUuid: string) {
    return AIGenerateKeyResults.getInstance().execute(goalUuid);
  }

  // ===== Quota Operations =====

  /**
   * 获取配额信息
   */
  getQuota() {
    return GetQuota.getInstance().execute();
  }

  /**
   * 检查配额可用性
   * @param tokensNeeded 需要的 token 数量
   */
  checkQuotaAvailability(tokensNeeded: number) {
    return CheckQuotaAvailability.getInstance().execute(tokensNeeded);
  }

  // ===== Provider Operations =====

  /**
   * 获取 AI 提供商列表
   */
  listProviders() {
    return ListProviders.getInstance().execute();
  }

  /**
   * 创建 AI 提供商
   */
  createProvider(input: CreateAIProviderRequest) {
    return CreateProvider.getInstance().execute(input);
  }

  /**
   * 测试提供商连接
   */
  testProviderConnection(input: TestAIProviderConnectionRequest) {
    return TestProviderConnection.getInstance().execute(input);
  }

  /**
   * 设置默认提供商
   */
  setDefaultProvider(providerUuid: string) {
    return SetDefaultProvider.getInstance().execute(providerUuid);
  }

  // ===== Provider Extended Operations (via infrastructure-client) =====

  /**
   * 获取提供商详情
   */
  getProvider(providerUuid: string) {
    return AIContainer.getInstance().getProviderConfigApiClient().getProviderById(providerUuid);
  }

  /**
   * 更新提供商配置
   */
  updateProvider(providerUuid: string, request: UpdateAIProviderRequest) {
    return AIContainer.getInstance().getProviderConfigApiClient().updateProvider(providerUuid, request);
  }

  /**
   * 删除提供商
   */
  deleteProvider(providerUuid: string) {
    return AIContainer.getInstance().getProviderConfigApiClient().deleteProvider(providerUuid);
  }

  /**
   * 刷新提供商模型列表
   */
  refreshModels(providerUuid: string) {
    return AIContainer.getInstance().getProviderConfigApiClient().refreshModels(providerUuid);
  }
}

/**
 * AI 应用服务单例
 */
export const aiApplicationService = new AIApplicationService();

/**
 * AI Conversation API Client Port Interface
 *
 * Defines the contract for AI Conversation API operations.
 * Implementations: AIConversationHttpAdapter (web), AIConversationIpcAdapter (desktop)
 */

import type {
  AIConversationClientDTO,
  ConversationListResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
} from '@dailyuse/contracts/ai';

/**
 * AI Conversation API Client Interface
 */
export interface IAIConversationApiClient {
  // ===== Conversation CRUD =====

  /** 创建对话 */
  createConversation(request: CreateConversationRequest): Promise<AIConversationClientDTO>;

  /** 获取对话列表 */
  getConversations(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<ConversationListResponse>;

  /** 获取对话详情 */
  getConversationById(uuid: string): Promise<AIConversationClientDTO>;

  /** 更新对话 */
  updateConversation(uuid: string, request: UpdateConversationRequest): Promise<AIConversationClientDTO>;

  /** 删除对话 */
  deleteConversation(uuid: string): Promise<void>;

  // ===== Conversation Status =====

  /** 关闭对话 */
  closeConversation(uuid: string): Promise<AIConversationClientDTO>;

  /** 归档对话 */
  archiveConversation(uuid: string): Promise<AIConversationClientDTO>;
}

/**
 * AI Conversation Service
 * AI 对话应用服务
 *
 * 职责（DDD 应用服务层）：
 * - 协调对话的 CRUD 操作
 * - 调用领域聚合根的业务方法
 * - 通过仓储持久化
 * - DTO 转换
 *
 * 依赖：
 * - IAIConversationRepository（仓储接口）
 * - AIConversationServer（领域聚合根）
 */

import type { IAIConversationRepository } from '@dailyuse/domain-server/ai';
import { AIConversationServer, MessageServer } from '@dailyuse/domain-server/ai';
import type { AIConversationServerDTO, AIConversationClientDTO, MessageClientDTO } from '@dailyuse/contracts/ai';
import { MessageRole, ConversationStatus } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIConversationService');

/**
 * AI Conversation Service
 */
export class AIConversationService {
  constructor(private conversationRepository: IAIConversationRepository) {}

  /**
   * 创建新对话
   */
  async createConversation(accountUuid: string, title?: string): Promise<AIConversationClientDTO> {
    try {
      // 创建聚合根
      const conversation = AIConversationServer.create({
        accountUuid,
        title: title ?? 'New Chat',
      });

      // 持久化 - 传递聚合根
      await this.conversationRepository.save(conversation);

      logger.info('Conversation created', {
        uuid: conversation.uuid,
        accountUuid,
        title: conversation.title,
      });

      // 返回 ClientDTO
      return conversation.toClientDTO();
    } catch (error) {
      logger.error('Failed to create conversation', { error, accountUuid, title });
      throw error;
    }
  }

  /**
   * 获取对话详情（包含消息）
   */
  async getConversation(
    conversationUuid: string,
    includeMessages: boolean = true,
  ): Promise<AIConversationServer | null> {
    try {
      const conversation = await this.conversationRepository.findByUuid(conversationUuid, {
        includeChildren: includeMessages,
      });
      if (!conversation) {
        return null;
      }

      logger.info('Conversation retrieved', { uuid: conversationUuid });

      return conversation;
    } catch (error) {
      logger.error('Failed to get conversation', { error, conversationUuid });
      throw error;
    }
  }

  /**
   * 获取用户的所有对话（列表视图 - 不包含消息）
   */
  async listConversations(
    accountUuid: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    conversations: AIConversationClientDTO[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }> {
    try {
      // 获取所有对话（接口中无findRecent方法）
      const allConversations = await this.conversationRepository.findByAccountUuid(accountUuid);
      const total = allConversations.length;

      // 手动分页
      const offset = (page - 1) * limit;
      const paginatedConversations = allConversations.slice(offset, offset + limit);

      // 转换为 ClientDTO
      const conversations = paginatedConversations.map((conversation) =>
        conversation.toClientDTO(),
      );

      logger.info('Conversations listed', {
        accountUuid,
        page,
        limit,
        count: conversations.length,
        total,
      });

      return {
        conversations,
        pagination: {
          page,
          limit,
          total,
        },
      };
    } catch (error) {
      logger.error('Failed to list conversations', { error, accountUuid, page, limit });
      throw error;
    }
  }

  /**
   * 删除对话（软删除）
   */
  async deleteConversation(conversationUuid: string): Promise<void> {
    try {
      // 检查对话是否存在（接口中无exists方法）
      const conversation = await this.conversationRepository.findByUuid(conversationUuid);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // 软删除
      await this.conversationRepository.delete(conversationUuid);

      logger.info('Conversation deleted', { uuid: conversationUuid });
    } catch (error) {
      logger.error('Failed to delete conversation', { error, conversationUuid });
      throw error;
    }
  }

  /**
   * 添加消息到对话
   */
  async addMessage(
    conversationUuid: string,
    role: MessageRole,
    content: string,
    tokenCount?: number,
  ): Promise<MessageClientDTO> {
    try {
      // 获取对话聚合根
      const conversation = await this.conversationRepository.findByUuid(conversationUuid, {
        includeChildren: true,
      });
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // 创建消息实体
      const message = MessageServer.create({
        conversationUuid,
        role,
        content,
        tokenCount,
      });

      // 通过聚合根添加消息
      conversation.addMessage(message);

      // 持久化 - 传递聚合根
      await this.conversationRepository.save(conversation);

      logger.info('Message added to conversation', {
        conversationUuid,
        messageUuid: message.uuid,
        role,
      });

      return message.toClientDTO();
    } catch (error) {
      logger.error('Failed to add message', { error, conversationUuid, role });
      throw error;
    }
  }

  /**
   * 获取对话历史（按状态过滤）
   */
  async getConversationsByStatus(
    accountUuid: string,
    status: ConversationStatus,
  ): Promise<AIConversationClientDTO[]> {
    try {
      // 获取所有对话（接口中无findByStatus方法）
      const allConversations = await this.conversationRepository.findByAccountUuid(accountUuid);

      // 手动过滤状态
      const filteredConversations = allConversations.filter((conv) => {
        const dto = conv.toServerDTO();
        return dto.status === status;
      });

      const conversations = filteredConversations.map((conversation) => conversation.toClientDTO());

      logger.info('Conversations retrieved by status', {
        accountUuid,
        status,
        count: conversations.length,
      });

      return conversations;
    } catch (error) {
      logger.error('Failed to get conversations by status', { error, accountUuid, status });
      throw error;
    }
  }

  /**
   * 更新对话状态
   */
  async updateConversationStatus(
    conversationUuid: string,
    status: ConversationStatus,
  ): Promise<void> {
    try {
      const conversation = await this.conversationRepository.findByUuid(conversationUuid);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.updateStatus(status);

      await this.conversationRepository.save(conversation);

      logger.info('Conversation status updated', { uuid: conversationUuid, status });
    } catch (error) {
      logger.error('Failed to update conversation status', { error, conversationUuid, status });
      throw error;
    }
  }
}



/**
 * Prisma AI Conversation Repository
 * Prisma AI 对话仓储实现
 *
 * 职责：
 * - 操作 ai_conversations 和 ai_messages 表
 * - ServerDTO ↔ Prisma Model 映射
 * - 聚合根模式：级联操作消息
 */

import { PrismaClient } from '@prisma/client';
import type { IAIConversationRepository } from '@dailyuse/domain-server/ai';
import { AIConversationServer, MessageServer } from '@dailyuse/domain-server/ai';
import { ConversationStatus } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('PrismaAIConversationRepository');

/**
 * PrismaAIConversationRepository 实现
 */
export class PrismaAIConversationRepository implements IAIConversationRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 保存对话（包括级联保存消息）
   */
  async save(conversation: AIConversationServer): Promise<void> {
    try {
      // 将聚合根转换为DTO
      const dto = conversation.toServerDTO(true); // includeChildren = true

      await this.prisma.$transaction(async (tx) => {
        // Upsert conversation
        await tx.aiConversation.upsert({
          where: { uuid: dto.uuid },
          create: {
            uuid: dto.uuid,
            accountUuid: dto.accountUuid,
            title: dto.title,
            status: dto.status,
            messageCount: dto.messageCount,
            lastMessageAt: dto.lastMessageAt ? new Date(dto.lastMessageAt) : null,
            createdAt: new Date(dto.createdAt),
            updatedAt: new Date(dto.updatedAt),
            deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
          },
          update: {
            title: dto.title,
            status: dto.status,
            messageCount: dto.messageCount,
            lastMessageAt: dto.lastMessageAt ? new Date(dto.lastMessageAt) : null,
            updatedAt: new Date(dto.updatedAt),
            deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
          },
        });

        // Cascade save messages if present
        if (dto.messages && dto.messages.length > 0) {
          // Delete existing messages
          await tx.aiMessage.deleteMany({
            where: { conversationUuid: dto.uuid },
          });

          // Insert new messages
          await tx.aiMessage.createMany({
            data: dto.messages.map((msg) => ({
              uuid: msg.uuid,
              conversationUuid: msg.conversationUuid,
              role: msg.role,
              content: msg.content,
              tokenUsage: msg.tokenCount ? JSON.stringify({ totalTokens: msg.tokenCount }) : null,
              createdAt: new Date(msg.createdAt),
            })),
          });
        }
      });

      logger.info('Conversation saved', { uuid: dto.uuid });
    } catch (error) {
      logger.error('Failed to save conversation', { error, uuid: conversation.uuid });
      throw error;
    }
  }

  /**
   * 根据UUID查找对话
   */
  async findByUuid(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<AIConversationServer | null> {
    try {
      const conversation = await this.prisma.aiConversation.findUnique({
        where: { uuid },
        include: {
          messages: options?.includeChildren
            ? {
                orderBy: { createdAt: 'asc' },
              }
            : false,
        },
      });

      if (!conversation) {
        return null;
      }

      return this.mapToDomainEntity(conversation);
    } catch (error) {
      logger.error('Failed to find conversation by UUID', { error, uuid });
      throw error;
    }
  }

  /**
   * 根据账户UUID查找所有对话
   */
  async findByAccountUuid(
    accountUuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<AIConversationServer[]> {
    try {
      const conversations = await this.prisma.aiConversation.findMany({
        where: {
          accountUuid,
          deletedAt: null,
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        include: {
          messages: options?.includeChildren
            ? {
                orderBy: { createdAt: 'asc' },
              }
            : false,
        },
      });

      return conversations.map((conv) => this.mapToDomainEntity(conv));
    } catch (error) {
      logger.error('Failed to find conversations by account', { error, accountUuid });
      throw error;
    }
  }

  /**
   * 软删除对话
   */
  async delete(uuid: string): Promise<void> {
    try {
      await this.prisma.aiConversation.update({
        where: { uuid },
        data: {
          deletedAt: new Date(),
          status: ConversationStatus.ARCHIVED,
          updatedAt: new Date(),
        },
      });

      logger.info('Conversation soft deleted', { uuid });
    } catch (error) {
      logger.error('Failed to delete conversation', { error, uuid });
      throw error;
    }
  }

  /**
   * 根据状态查找对话
   */
  async findByStatus(
    accountUuid: string,
    status: ConversationStatus,
    options?: { includeChildren?: boolean },
  ): Promise<AIConversationServer[]> {
    try {
      const conversations = await this.prisma.aiConversation.findMany({
        where: {
          accountUuid,
          status,
          deletedAt: null,
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        include: {
          messages: options?.includeChildren
            ? {
                orderBy: { createdAt: 'asc' },
              }
            : false,
        },
      });

      return conversations.map((conv) => this.mapToDomainEntity(conv));
    } catch (error) {
      logger.error('Failed to find conversations by status', { error, accountUuid, status });
      throw error;
    }
  }

  /**
   * 查找最近的对话（分页）
   */
  async findRecent(
    accountUuid: string,
    limit: number,
    offset = 0,
  ): Promise<AIConversationServer[]> {
    try {
      const conversations = await this.prisma.aiConversation.findMany({
        where: {
          accountUuid,
          deletedAt: null,
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      return conversations.map((conv) => this.mapToDomainEntity(conv));
    } catch (error) {
      logger.error('Failed to find recent conversations', { error, accountUuid, limit, offset });
      throw error;
    }
  }

  /**
   * 检查对话是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    try {
      const count = await this.prisma.aiConversation.count({
        where: { uuid, deletedAt: null },
      });
      return count > 0;
    } catch (error) {
      logger.error('Failed to check conversation existence', { error, uuid });
      throw error;
    }
  }

  /**
   * 将 Prisma 模型映射为领域聚合根
   */
  private mapToDomainEntity(data: any): AIConversationServer {
    // 先构建 ServerDTO
    const dto = {
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      title: data.title,
      status: data.status as ConversationStatus,
      messageCount: data.messageCount,
      lastMessageAt: data.lastMessageAt ? data.lastMessageAt.getTime() : null,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
      deletedAt: data.deletedAt ? data.deletedAt.getTime() : null,
      messages: data.messages
        ? data.messages.map((msg: any) => ({
            uuid: msg.uuid,
            conversationUuid: msg.conversationUuid,
            role: msg.role,
            content: msg.content,
            tokenCount: msg.tokenUsage
              ? ((JSON.parse(msg.tokenUsage) as { totalTokens?: number }).totalTokens ?? null)
              : null,
            createdAt: msg.createdAt.getTime(),
          }))
        : null,
    };

    // 从 DTO 重建聚合根
    return AIConversationServer.fromServerDTO(dto);
  }
}





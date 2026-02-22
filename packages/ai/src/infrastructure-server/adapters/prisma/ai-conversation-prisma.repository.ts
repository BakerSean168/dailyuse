/**
 * AIConversation Prisma Repository
 *
 * Prisma implementation of IAIConversationRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { PrismaClient, AiConversation as PrismaAiConversation, AiMessage as PrismaAiMessage } from '@dailyuse/database';
import type { IAIConversationRepository, AIConversationQueryOptions } from '../../../domain-server';
import { AIConversation } from '../../../domain-server/aggregates/ai-conversation';
import type { ConversationStatus } from '@dailyuse/contracts/ai';
import type { AIConversationPersistenceDTO, MessagePersistenceDTO } from '@dailyuse/contracts/ai';

type PrismaAiConversationWithMessages = PrismaAiConversation & {
  messages?: PrismaAiMessage[];
};

/**
 * AIConversation Prisma Repository
 *
 * Prisma implementation of IAIConversationRepository.
 */
export class AIConversationPrismaRepository implements IAIConversationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(conversation: AIConversation): Promise<void> {
    const data = conversation.toPersistenceDTO();

    await this.prisma.aiConversation.upsert({
      where: { id: String(data.id) },
      create: {
        id: String(data.id),
        identityId: String(data.identityId),
        name: data.name,
        status: data.status,
        messageCount: data.messageCount,
        lastMessageAt: data.lastMessageAt,
        version: data.version,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
      },
      update: {
        name: data.name,
        status: data.status,
        messageCount: data.messageCount,
        lastMessageAt: data.lastMessageAt,
        version: data.version,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
      },
    });

    if (data.messages) {
      await this.prisma.aiMessage.deleteMany({
        where: { conversationId: String(data.id) },
      });

      if (data.messages.length > 0) {
        await this.prisma.aiMessage.createMany({
          data: data.messages.map((message: MessagePersistenceDTO) => ({
            id: String(message.id),
            conversationId: String(message.conversationId),
            role: message.role,
            content: message.content,
            tokenUsage:
              message.tokenCount != null
                ? JSON.stringify({ totalTokens: message.tokenCount })
                : null,
            createdAt: message.createdAt,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  async findById(id: string, options?: AIConversationQueryOptions): Promise<AIConversation | null> {
    const row = await this.prisma.aiConversation.findFirst({
      where: { id, deletedAt: null },
      include: options?.includeChildren ? { messages: { orderBy: { createdAt: 'asc' } } } : undefined,
    });

    if (!row) {
      return null;
    }

    return AIConversation.fromPersistenceDTO(this.toPersistenceDTO(row, Boolean(options?.includeChildren)));
  }

  async findByIdentityId(identityId: string, options?: AIConversationQueryOptions): Promise<AIConversation[]> {
    const rows = await this.prisma.aiConversation.findMany({
      where: { identityId, deletedAt: null },
      include: options?.includeChildren ? { messages: { orderBy: { createdAt: 'asc' } } } : undefined,
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row: PrismaAiConversationWithMessages) =>
      AIConversation.fromPersistenceDTO(this.toPersistenceDTO(row, Boolean(options?.includeChildren))),
    );
  }

  async findByStatus(
    identityId: string,
    status: ConversationStatus,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]> {
    const rows = await this.prisma.aiConversation.findMany({
      where: { identityId, status, deletedAt: null },
      include: options?.includeChildren ? { messages: { orderBy: { createdAt: 'asc' } } } : undefined,
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row: PrismaAiConversationWithMessages) =>
      AIConversation.fromPersistenceDTO(this.toPersistenceDTO(row, Boolean(options?.includeChildren))),
    );
  }

  async findRecent(identityId: string, limit: number, offset?: number): Promise<AIConversation[]> {
    const rows = await this.prisma.aiConversation.findMany({
      where: { identityId, deletedAt: null },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
      skip: offset ?? 0,
    });

    return rows.map((row: PrismaAiConversationWithMessages) => AIConversation.fromPersistenceDTO(this.toPersistenceDTO(row, false)));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.aiConversation.update({
      where: { id },
      data: {
        status: 'Archived',
        deletedAt: new Date(),
      },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.aiConversation.count({
      where: { id, deletedAt: null },
    });

    return count > 0;
  }

  private toPersistenceDTO(row: PrismaAiConversationWithMessages, includeMessages: boolean): AIConversationPersistenceDTO {
    const messages = includeMessages
      ? (row.messages ?? []).map((message) => this.toMessagePersistenceDTO(message))
      : null;

    return {
      id: row.id,
      identityId: row.identityId,
      name: row.name,
      status: row.status,
      messageCount: row.messageCount,
      lastMessageAt: row.lastMessageAt,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      messages,
    };
  }

  private toMessagePersistenceDTO(row: PrismaAiMessage): MessagePersistenceDTO {
    let tokenCount: number | null = null;

    if (row.tokenUsage) {
      try {
        const parsed = JSON.parse(row.tokenUsage);
        if (typeof parsed === 'number') {
          tokenCount = parsed;
        } else if (typeof parsed?.tokenCount === 'number') {
          tokenCount = parsed.tokenCount;
        } else if (typeof parsed?.totalTokens === 'number') {
          tokenCount = parsed.totalTokens;
        }
      } catch {
        tokenCount = null;
      }
    }

    return {
      id: row.id,
      conversationId: row.conversationId,
      role: row.role,
      content: row.content,
      tokenCount,
      createdAt: row.createdAt,
    };
  }
}

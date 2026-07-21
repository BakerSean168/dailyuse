/**
 * AIConversation Prisma Repository
 *
 * Prisma implementation of IAIConversationRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type {
  PrismaClient,
  Prisma,
  AiConversation as PrismaAiConversation,
  AiMessage as PrismaAiMessage,
} from '@dailyuse/database';
import type { IAIConversationRepository, AIConversationQueryOptions } from '../../../domain';
import { AIConversation } from '../../../domain/aggregates/ai-conversation';
import { Message } from '../../../domain/entities/message';
import type { AIEventMap } from '@dailyuse/contracts/ai';
import { ConversationStatus, MessageRole } from '@dailyuse/contracts/ai';
import { AiConversationId } from '../../../domain/value-objects/ai-conversation-id';
import { AiMessageId } from '../../../domain/value-objects/ai-message-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { createTypedEventPublisher, eventBus, flushDomainEvents } from '@dailyuse/utils/domain';

type PrismaAiConversationWithMessages = PrismaAiConversation & {
  messages?: PrismaAiMessage[];
};

const aiEventPublisher = createTypedEventPublisher<AIEventMap>(eventBus);

/**
 * AIConversation Prisma Repository
 *
 * Prisma implementation of IAIConversationRepository.
 */
export class AIConversationPrismaRepository implements IAIConversationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(conversation: AIConversation): Promise<void> {
    const dto = conversation.toServerDTO(true);

    // 多条写入放进单事务，避免 upsert 成功而 message 同步失败导致的半持久化。
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.aiConversation.upsert({
        where: { id: String(dto.id) },
        create: {
          id: String(dto.id),
          identityId: String(dto.identityId),
          name: dto.name,
          status: dto.status,
          messageCount: dto.messageCount,
          lastMessageAt: dto.lastMessageAt != null ? new Date(dto.lastMessageAt) : null,
          version: dto.version,
          createdAt: new Date(dto.createdAt),
          updatedAt: new Date(dto.updatedAt),
          deletedAt: dto.deletedAt != null ? new Date(dto.deletedAt) : null,
        },
        update: {
          name: dto.name,
          status: dto.status,
          messageCount: dto.messageCount,
          lastMessageAt: dto.lastMessageAt != null ? new Date(dto.lastMessageAt) : null,
          version: dto.version,
          updatedAt: new Date(dto.updatedAt),
          deletedAt: dto.deletedAt != null ? new Date(dto.deletedAt) : null,
        },
      });

      if (dto.messages) {
        await tx.aiMessage.deleteMany({
          where: { conversationId: String(dto.id) },
        });

        if (dto.messages.length > 0) {
          await tx.aiMessage.createMany({
            data: dto.messages.map((message) => ({
              id: String(message.id),
              conversationId: String(message.conversationId),
              identityId: String(dto.identityId),
              role: message.role,
              content: message.content,
              tokenUsage:
                message.tokenCount != null
                  ? JSON.stringify({ totalTokens: message.tokenCount })
                  : null,
              createdAt: new Date(message.createdAt),
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    // 事件在事务成功提交后派发；send 已具备 per-handler 错误隔离，派发失败不回滚业务。
    flushDomainEvents(aiEventPublisher, conversation);
  }

  async findById(id: string, options?: AIConversationQueryOptions): Promise<AIConversation | null> {
    const row = await this.prisma.aiConversation.findFirst({
      where: { id, deletedAt: null },
      include: options?.includeChildren
        ? { messages: { orderBy: { createdAt: 'asc' } } }
        : undefined,
    });

    if (!row) {
      return null;
    }

    return this.toDomain(row, Boolean(options?.includeChildren));
  }

  async findByIdentityId(
    identityId: string,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]> {
    const rows = await this.prisma.aiConversation.findMany({
      where: { identityId, deletedAt: null },
      include: options?.includeChildren
        ? { messages: { orderBy: { createdAt: 'asc' } } }
        : undefined,
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row: PrismaAiConversationWithMessages) =>
      this.toDomain(row, Boolean(options?.includeChildren)),
    );
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


  private toDomain(
    row: PrismaAiConversationWithMessages,
    includeMessages: boolean,
  ): AIConversation {
    const messages = includeMessages
      ? (row.messages ?? []).map((message) => this.toMessageDomain(message))
      : [];

    return AIConversation.load({
      id: AiConversationId.of(row.id),
      identityId: IdentityId.of(row.identityId),
      name: row.name,
      status: row.status as ConversationStatus,
      messageCount: row.messageCount,
      lastMessageAt: row.lastMessageAt,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      messages,
    });
  }

  private toMessageDomain(row: PrismaAiMessage): Message {
    let tokenCount: number | null = null;

    if (row.tokenUsage) {
      try {
        const parsed = JSON.parse(row.tokenUsage);
        if (typeof parsed === 'number') {
          tokenCount = parsed;
        } else if (isTokenUsageLike(parsed)) {
          tokenCount = parsed.tokenCount ?? parsed.totalTokens ?? null;
        }
      } catch {
        tokenCount = null;
      }
    }

    return Message.load({
      id: AiMessageId.of(row.id),
      conversationId: AiConversationId.of(row.conversationId),
      role: row.role as MessageRole,
      content: row.content,
      tokenCount,
      version: 1,
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
      deletedAt: null,
    });
  }
}

function isTokenUsageLike(
  value: unknown,
): value is { tokenCount?: number; totalTokens?: number } {
  return value !== null && typeof value === 'object';
}

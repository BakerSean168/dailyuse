/**
 * AIConversation Aggregate Root - Server Interface
 * AI对话聚合根 - 服务端接口
 */

import type { AiConversationId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { ConversationStatus } from '../value-objects/conversation-status';
import type { MessageServerDTO, MessagePersistenceDTO } from '../entities/message-server';

// ============ DTO 定义 ============

/**
 * AIConversation Server DTO（应用层）
 * 使用 TransferDate (number) 时间戳
 */
export interface AIConversationServerDTO {
  id: AiConversationId;
  identityId: IdentityId;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt: TransferDate | null;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;

  // 子实体 DTO
  messages: MessageServerDTO[] | null;
}

/**
 * AIConversation Persistence DTO（数据库层）
 * 使用 PersistenceDate (Date 对象)
 */
export interface AIConversationPersistenceDTO {
  id: AiConversationId;
  identityId: IdentityId;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt: PersistenceDate | null;
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;

  // 注意：子实体在数据库中是独立表，通过外键关联
  // Persistence 层可选包含子实体数据
  messages: MessagePersistenceDTO[] | null;
}

// ============ 领域事件 ============

/**
 * 对话创建事件
 */
export interface AIConversationCreatedEvent {
  type: 'ai_conversation.created';
  aggregateId: AiConversationId;
  timestamp: DomainDate;
  payload: {
    conversation: AIConversationServerDTO;
    identityId: IdentityId;
  };
}

/**
 * 对话更新事件
 */
export interface AIConversationUpdatedEvent {
  type: 'ai_conversation.updated';
  aggregateId: AiConversationId;
  timestamp: DomainDate;
  payload: {
    conversationId: AiConversationId;
    previousData: Partial<AIConversationServerDTO>;
    changes: string[];
  };
}

/**
 * 消息添加事件
 */
export interface AIMessageAddedEvent {
  type: 'ai_conversation.message_added';
  aggregateId: AiConversationId;
  timestamp: DomainDate;
  payload: {
    conversationId: AiConversationId;
    message: MessageServerDTO;
  };
}

/**
 * 对话删除事件
 */
export interface AIConversationDeletedEvent {
  type: 'ai_conversation.deleted';
  aggregateId: AiConversationId;
  timestamp: DomainDate;
  payload: {
    conversationId: AiConversationId;
    deletedAt: DomainDate;
  };
}

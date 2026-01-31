/**
 * AIConversation Aggregate Root - Client Interface
 * AI对话聚合�?- 客户端接�?
 */

import type { AiConversationId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { ConversationStatus } from '../value-objects/conversation-status';
import type { AIConversationServerDTO } from './ai-conversation-server';
import type { MessageClient, MessageClientDTO } from '../entities/message-client';

// ============ DTO 定义 ============

export interface AIConversationClientDTO {
  id: string;
  identityId: string;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // 子实�?DTO
  messages: MessageClientDTO[] | null;
}

// ============ 实体接口 ============

export interface AIConversationClient {
  // 基础属�?
  id: AiConversationId;
  identityId: IdentityId;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt: DomainDate | null;
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // 子实�?
  messages: MessageClient[] | null;

  // DTO 转换
}

// ============ 静态工厂方法接�?============

export interface AIConversationClientInstance extends AIConversationClient {
  clone(): AIConversationClient;
}

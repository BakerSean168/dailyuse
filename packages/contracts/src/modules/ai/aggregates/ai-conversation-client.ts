/**
 * AIConversation Aggregate Root - Client Interface
 * AI对话聚合根 - 客户端接口
 */

import type { AiConversationId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { ConversationStatus } from '../value-objects/conversation-status';
import type { MessageClient, MessageClientDTO } from '../entities/message-client';

// ============ DTO 定义 ============

/**
 * AIConversation Client DTO
 * 使用 TransferDate (number) 时间戳
 */
export interface AIConversationClientDTO {
  id: string;
  identityId: string;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // 子实体 DTO
  messages: MessageClientDTO[] | null;
}

// ============ 聚合根接口 ============

/**
 * AIConversation 聚合根 - Client 接口
 */
export interface AIConversationClient {
  // 基础属性
  id: AiConversationId;
  identityId: IdentityId;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt: DomainDate | null;
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // 子实体
  messages: MessageClient[] | null;
}

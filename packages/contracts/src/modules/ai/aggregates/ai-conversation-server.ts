/**
 * AIConversation Aggregate Root - Server Interface
 * AI对话聚合根 - 服务端接口
 */

import type { AiConversationId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '../../../primitives';
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
// 事件接口已移至 domain/events/ 目录，使用 payload-only 格式。
// Event interfaces moved to domain/events/ directory with payload-only format.

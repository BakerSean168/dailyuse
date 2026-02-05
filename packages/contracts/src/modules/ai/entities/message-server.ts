/**
 * Message Entity - Server Interface
 * 消息实体 - 服务端接口
 */

import type { AiMessageId, AiConversationId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { MessageRole } from '../value-objects/message-role';

// ============ DTO 定义 ============

/**
 * Message Server DTO（应用层）
 * 使用 TransferDate (number) 时间戳
 */
export interface MessageServerDTO {
  id: AiMessageId;
  conversationId: AiConversationId;
  role: MessageRole;
  content: string;
  tokenCount: number | null;
  createdAt: TransferDate;
}

/**
 * Message Persistence DTO（数据库层）
 * 使用 PersistenceDate (Date 对象)
 */
export interface MessagePersistenceDTO {
  id: AiMessageId;
  conversationId: AiConversationId;
  role: MessageRole;
  content: string;
  tokenCount: number | null;
  createdAt: PersistenceDate;
}

// ============ 实体接口 ============

/**
 * Message 实体 - Server 接口
 */
export interface MessageServer {
  id: AiMessageId;
  conversationId: AiConversationId;
  role: MessageRole;
  content: string;
  tokenCount: number | null;
  createdAt: DomainDate;
}

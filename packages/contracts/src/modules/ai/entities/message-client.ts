/**
 * Message Entity - Client Interface
 * 消息实体 - 客户端接口
 */

import type { AiMessageId, AiConversationId, TransferDate, DomainDate } from '@/primitives';
import type { MessageRole } from '../value-objects/message-role';

// ============ DTO 定义 ============

/**
 * Message Client DTO
 * 使用 TransferDate (number) 时间戳
 */
export interface MessageClientDTO {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  tokenCount: number | null;
  createdAt: TransferDate;

  // UI 计算字段
  isUser: boolean;
  isAssistant: boolean;
  isSystem: boolean;
  formattedTime: string;
}

// ============ 实体接口 ============

/**
 * Message 实体 - Client 接口
 */
export interface MessageClient {
  id: AiMessageId;
  conversationId: AiConversationId;
  role: MessageRole;
  content: string;
  tokenCount: number | null;
  createdAt: DomainDate;

  // ===== 计算属性 =====
  isUser: boolean;
  isAssistant: boolean;
  isSystem: boolean;
  formattedTime: string;
}

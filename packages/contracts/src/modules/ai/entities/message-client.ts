/**
 * Message Entity - Client Interface
 * 消息实体 - 客户端接口
 */

import type { AiMessageId, AiConversationId, TransferDate, DomainDate } from '../../../primitives';
import type { MessageRole } from '../value-objects/message-role';

// ============ DTO 定义 ============

/**
 * Message Client DTO
 * 使用 TransferDate (number) 时间戳
 */
export interface MessageClientDTO {
  id: AiMessageId;
  conversationId: AiConversationId;
  role: MessageRole;
  content: string;
  tokenCount: number | null;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;

  // UI 计算字段
  isUser: boolean;
  isAssistant: boolean;
  isSystem: boolean;
  formattedTime: string;
}

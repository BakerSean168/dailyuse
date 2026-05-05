/**
 * Message Entity - Server Interface
 * 消息实体 - 服务端接口
 */

import type { AiMessageId, AiConversationId, TransferDate } from '../../../primitives';
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

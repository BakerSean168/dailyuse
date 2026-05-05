/**
 * AIConversation Aggregate Root - Server Interface
 * AI对话聚合根 - 服务端接口
 */

import type { AiConversationId, IdentityId, TransferDate } from '../../../primitives';
import type { ConversationStatus } from '../value-objects/conversation-status';
import type { MessageServerDTO } from '../entities/message-server';

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

// ============ 领域事件 ============
// 事件接口已移至 domain/events/ 目录，使用 payload-only 格式。
// Event interfaces moved to domain/events/ directory with payload-only format.

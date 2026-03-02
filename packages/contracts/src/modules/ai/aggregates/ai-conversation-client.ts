/**
 * AIConversation Aggregate Root - Client Interface
 * AI对话聚合根 - 客户端接口
 */

import type { AiConversationId, IdentityId, TransferDate, DomainDate } from '../../../primitives';
import type { ConversationStatus } from '../value-objects/conversation-status';
import type { MessageClientDTO } from '../entities/message-client';

// ============ DTO 定义 ============

/**
 * AIConversation Client DTO
 * 使用 TransferDate (number) 时间戳
 */
export interface AIConversationClientDTO {
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
  messages: MessageClientDTO[] | null;
}

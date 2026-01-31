/**
 * AIConversation Aggregate Root - Server Interface
 * AI对话聚合根 - 服务端接口
 */

import type { ConversationStatus } from '../enums';
import type { MessageServer, MessageServerDTO } from '../entities/message-server';
import type { AIConversationClientDTO } from './ai-conversation-client';

// ============ DTO 定义 ============

/**
 * AIConversation Server DTO（应用层）
 */
export interface AIConversationServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt?: number | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // 子实体 DTO
  messages?: MessageServerDTO[] | null;
}

/**
 * AIConversation Persistence DTO（数据库层）
 * 注意：使用 camelCase 命名，与数据库 snake_case 的映射在仓储层处理
 */
export interface AIConversationPersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt?: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // 注意：子实体在数据库中是独立表，通过外键关联
  // Persistence 层不包含子实体数据
}

// ============ 领域事件 ============

/**
 * 对话创建事件
 */
export interface AIConversationCreatedEvent {
  type: 'ai_conversation.created';
  aggregateId: string; // conversationUuid
  timestamp: Date;
  payload: {
    conversation: AIConversationServerDTO;
    accountUuid: string;
  };
}

/**
 * 对话更新事件
 */
export interface AIConversationUpdatedEvent {
  type: 'ai_conversation.updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    conversationUuid: string;
    previousData: Partial<AIConversationServerDTO>;
    changes: string[];
  };
}

/**
 * 消息添加事件
 */
export interface AIMessageAddedEvent {
  type: 'ai_conversation.message_added';
  aggregateId: string;
  timestamp: Date;
  payload: {
    conversationUuid: string;
    message: MessageServerDTO;
  };
}

/**
 * 对话删除事件
 */
export interface AIConversationDeletedEvent {
  type: 'ai_conversation.deleted';
  aggregateId: string;
  timestamp: Date;
  payload: {
    conversationUuid: string;
    deletedAt: Date;
  };
}

// ============ 实体接口 ============

/**
 * AIConversation 聚合根 - Server 接口（实例方法）
 */
export interface AIConversationServer {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt?: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // 子实体集合
  messages: MessageServer[];

  // ===== 子实体管理方法 =====

  /**
   * 添加消息到对话
   */

  /**
   * 获取所有消息
   */

  /**
   * 获取最新消息
   */

  /**
   * 更新对话状态
   */

  /**
   * 软删除对话
   */

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  /**
   * 转换为 Persistence DTO
   * 注意：Persistence 不包含子实体，子实体单独持久化
   */
}

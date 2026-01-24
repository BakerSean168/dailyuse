/**
 * AIConversation Aggregate Root - Server Interface
 * AI对话聚合根 - 服务端接口
 */

import type { ConversationStatus } from '../enums';
import type { MessageServer, MessageServerDTO } from '../entities/MessageServer';
import type { AIConversationClientDTO } from './AIConversationClient';

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
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

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
  timestamp: number;
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
  timestamp: number;
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
  timestamp: number;
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
  timestamp: number;
  payload: {
    conversationUuid: string;
    deletedAt: number;
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
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // 子实体集合
  messages: MessageServer[];

  // ===== 子实体管理方法 =====

  /**
   * 添加消息到对话
   */
  addMessage(message: MessageServer): void;

  /**
   * 获取所有消息
   */
  getAllMessages(): MessageServer[];

  /**
   * 获取最新消息
   */
  getLatestMessage(): MessageServer | null;

  /**
   * 更新对话状态
   */
  updateStatus(status: ConversationStatus): void;

  /**
   * 软删除对话
   */
  softDelete(): void;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toServerDTO(includeChildren?: boolean): AIConversationServerDTO;

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): AIConversationClientDTO;

  /**
   * 转换为 Persistence DTO
   * 注意：Persistence 不包含子实体，子实体单独持久化
   */
  toPersistenceDTO(): AIConversationPersistenceDTO;
}

/**
 * AIConversation 静态工厂方法接口
 */
export interface AIConversationServerStatic {
  /**
   * 创建新的 AIConversation 聚合根（静态工厂方法）
   */
  create(params: {
    accountUuid: string;
    title: string;
  }): AIConversationServer;

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  fromServerDTO(dto: AIConversationServerDTO): AIConversationServer;

  /**
   * 从 Persistence DTO 创建实体
   * 注意：需要单独加载子实体
   */
  fromPersistenceDTO(dto: AIConversationPersistenceDTO): AIConversationServer;
}

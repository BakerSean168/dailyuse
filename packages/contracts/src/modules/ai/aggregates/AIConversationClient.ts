/**
 * AIConversation Aggregate Root - Client Interface
 * AI对话聚合根 - 客户端接口
 */

import type { ConversationStatus } from '../enums';
import type { AIConversationServerDTO } from './AIConversationServer';
import type { MessageClient, MessageClientDTO } from '../entities/MessageClient';

// ============ DTO 定义 ============

export interface AIConversationClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // 子实体 DTO
  messages?: MessageClientDTO[] | null;

  // UI 计算字段
  isActive: boolean;
  isClosed: boolean;
  isArchived: boolean;
  canAddMessage: boolean;
  statusText: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  formattedLastMessageAt?: string | null;
}

// ============ 实体接口 ============

export interface AIConversationClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // 子实体
  messages?: MessageClient[] | null;

  // UI 计算属性
  isActive: boolean;
  isClosed: boolean;
  isArchived: boolean;
  canAddMessage: boolean;
  statusText: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  formattedLastMessageAt?: string | null;

  // 实体方法
  getDisplayTitle(): string;
  getStatusBadge(): string;
  canClose(): boolean;
  canArchive(): boolean;
  canDelete(): boolean;
  hasMessages(): boolean;
  getMessageCount(): number;

  // DTO 转换
  toClientDTO(): AIConversationClientDTO;
  toServerDTO(): AIConversationServerDTO;
}

// ============ 静态工厂方法接口 ============

export interface AIConversationClientStatic {
  fromClientDTO(dto: AIConversationClientDTO): AIConversationClient;
  fromServerDTO(dto: AIConversationServerDTO): AIConversationClient;
  forCreate(accountUuid: string, title: string): AIConversationClient;
}

export interface AIConversationClientInstance extends AIConversationClient {
  clone(): AIConversationClient;
}

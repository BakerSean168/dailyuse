/**
 * Message Entity - Client Interface
 * 消息实体 - 客户端接口
 */

import type { MessageRole } from '../enums';

// ============ DTO 定义 ============

/**
 * Message Client DTO
 */
export interface MessageClientDTO {
  uuid: string;
  conversationUuid: string;
  role: MessageRole;
  content: string;
  tokenCount?: number | null;
  createdAt: number;

  // UI 计算字段
  isUser: boolean;
  isAssistant: boolean;
  isSystem: boolean;
  formattedTime: string;
}

// ============ 实体接口 ============

/**
 * Message 实体 - Client 接口（实例方法）
 */
export interface MessageClient {
  uuid: string;
  conversationUuid: string;
  role: MessageRole;
  content: string;
  tokenCount?: number | null;
  createdAt: Date;

  // ===== 业务方法 =====

  /**
   * 检查是否为用户消息
   */
  isUserMessage(): boolean;

  /**
   * 检查是否为助手消息
   */
  isAssistantMessage(): boolean;

  /**
   * 检查是否为系统消息
   */
  isSystemMessage(): boolean;

  /**
   * 获取格式化的时间字符串
   */
  getFormattedTime(): string;

  /**
   * 获取内容摘要（前 N 个字符）
   */
  getContentSummary(maxLength?: number): string;

  // ===== 转换方法 =====

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): MessageClientDTO;
}

/**
 * Message 静态工厂方法接口
 */
export interface MessageClientStatic {
  /**
   * 创建新的 Message 实体（静态工厂方法）
   */
  create(params: {
    conversationUuid: string;
    role: MessageRole;
    content: string;
    tokenCount?: number;
  }): MessageClient;

  /**
   * 从 Client DTO 创建实体
   */
  fromClientDTO(dto: MessageClientDTO): MessageClient;
}

/**
 * Message Entity - Server Interface
 * 消息实体 - 服务端接口
 */

import type { MessageRole } from '../enums';
import type { MessageClientDTO } from './MessageClient';

// ============ DTO 定义 ============

/**
 * Message Server DTO（应用层）
 */
export interface MessageServerDTO {
  uuid: string;
  conversationUuid: string;
  role: MessageRole;
  content: string;
  tokenCount?: number | null;
  createdAt: number;
}

/**
 * Message Persistence DTO（数据库层）
 */
export interface MessagePersistenceDTO {
  uuid: string;
  conversationUuid: string;
  role: MessageRole;
  content: string;
  tokenCount?: number | null;
  createdAt: Date;
}

// ============ 实体接口 ============

/**
 * Message 实体 - Server 接口（实例方法）
 */
export interface MessageServer {
  uuid: string;
  conversationUuid: string;
  role: MessageRole;
  content: string;
  tokenCount?: number | null;
  createdAt: Date;

  // ===== 转换方法 =====
  /**
   * 转换为 Client DTO
   */
  /**
   * 转换为 Persistence DTO
   */}

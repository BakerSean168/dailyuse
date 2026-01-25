/**
 * SessionHistory Entity - Server Interface
 * 会话历史实体 - 服务端接口
 */

import type { SessionHistoryClientDTO } from './SessionHistoryClient';

// ============ DTO 定义 ============

/**
 * SessionHistory Server DTO
 */
export interface SessionHistoryServerDTO {
  uuid: string;
  sessionUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;
}

/**
 * SessionHistory Persistence DTO
 */
export interface SessionHistoryPersistenceDTO {
  uuid: string;
  session_uuid: string;
  action: string;
  details?: string | null; // JSON
  ip_address?: string | null;
  user_agent?: string | null;
  createdAt: Date;
}

// ============ 实体接口 ============

export interface SessionHistoryServer {
  uuid: string;
  sessionUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;

  toServerDTO(): SessionHistoryServerDTO;
  toClientDTO(): SessionHistoryClientDTO;
  toPersistenceDTO(): SessionHistoryPersistenceDTO;
}

export interface SessionHistoryServerStatic {
  create(params: {
    sessionUuid: string;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): SessionHistoryServer;
  fromServerDTO(dto: SessionHistoryServerDTO): SessionHistoryServer;
  fromPersistenceDTO(dto: SessionHistoryPersistenceDTO): SessionHistoryServer;
}

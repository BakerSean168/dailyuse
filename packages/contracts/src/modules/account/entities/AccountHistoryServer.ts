/**
 * AccountHistory Entity - Server Interface
 * 账户历史实体 - 服务端接口
 */
import type { AccountHistoryClientDTO } from './AccountHistoryClient';
// ============ DTO 定义 ============

/**
 * AccountHistory Server DTO
 */
export interface AccountHistoryServerDTO {
  uuid: string;
  accountUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;
}

/**
 * AccountHistory Persistence DTO
 */
export interface AccountHistoryPersistenceDTO {
  uuid: string;
  accountUuid: string;
  action: string;
  details?: string | null; // JSON
  ip_address?: string | null;
  user_agent?: string | null;
  createdAt: Date;
}

// ============ 实体接口 ============

export interface AccountHistoryServer {
  uuid: string;
  accountUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;

  toServerDTO(): AccountHistoryServerDTO;
  toClientDTO(): AccountHistoryClientDTO;
  toPersistenceDTO(): AccountHistoryPersistenceDTO;
}

export interface AccountHistoryServerStatic {
  create(params: {
    accountUuid: string;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): AccountHistoryServer;
  fromServerDTO(dto: AccountHistoryServerDTO): AccountHistoryServer;
  fromPersistenceDTO(dto: AccountHistoryPersistenceDTO): AccountHistoryServer;
}

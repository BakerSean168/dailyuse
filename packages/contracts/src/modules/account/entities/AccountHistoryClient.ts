/**
 * AccountHistory Entity - Client Interface
 * 账户历史实体 - 客户端接口
 */

// ============ DTO 定义 ============

/**
 * AccountHistory Client DTO
 */
export interface AccountHistoryClientDTO {
  uuid: string;
  accountUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;
}

// ============ 实体接口 ============

export interface AccountHistoryClient {
  uuid: string;
  accountUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;

  toClientDTO(): AccountHistoryClientDTO;
}

export interface AccountHistoryClientStatic {
  fromClientDTO(dto: AccountHistoryClientDTO): AccountHistoryClient;
}

/**
 * SessionHistory Entity - Client Interface
 * 会话历史实体 - 客户端接口
 */

// ============ DTO 定义 ============

/**
 * SessionHistory Client DTO
 */
export interface SessionHistoryClientDTO {
  uuid: string;
  sessionUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;
}

// ============ 实体接口 ============

export interface SessionHistoryClient {
  uuid: string;
  sessionUuid: string;
  action: string;
  details?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;

  toClientDTO(): SessionHistoryClientDTO;
}

export interface SessionHistoryClientStatic {
  fromClientDTO(dto: SessionHistoryClientDTO): SessionHistoryClient;
}

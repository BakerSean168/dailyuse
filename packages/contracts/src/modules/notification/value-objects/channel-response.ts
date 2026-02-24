/**
 * ChannelResponse Value Object
 * 渠道响应值对象
 */

// ============ 接口定义 ============

/**
 * ChannelResponse 接口
 */
export interface ChannelResponse {
  messageId: string | null;
  statusCode: number | null;
  data?: unknown;
}

// ============ DTO 定义 ============

/**
 * ChannelResponse DTO (传输层)
 */
export interface ChannelResponseDTO {
  messageId: string | null;
  statusCode: number | null;
  data?: unknown;
}

/**
 * ChannelResponse Persistence DTO (持久层)
 */
export interface ChannelResponsePersistenceDTO {
  messageId: string | null;
  statusCode: number | null;
  data: string | null; // JSON string
}

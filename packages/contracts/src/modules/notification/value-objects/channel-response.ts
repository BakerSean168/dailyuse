/**
 * ChannelResponse Value Object
 * 渠道响应值对象
 */

// ============ 接口定义 ============

/**
 * ChannelResponse Server Interface
 */
export interface IChannelResponse {
  messageId: string | null;
  statusCode: number | null;
  data?: any;

  // 值对象方法
  with(
    updates: Partial<
      Omit<
        IChannelResponse,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IChannelResponse;

  // DTO 转换方法
}

/**
 * ChannelResponse Client Interface
 */
export interface IChannelResponseClient {
  messageId: string | null;
  statusCode: number | null;
  data?: any;

  // UI 计算属性
  isSuccess: boolean;
  statusText: string;

  // 值对象方法

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * ChannelResponse DTO (Server)
 */
export interface ChannelResponseDTO {
  messageId: string | null;
  statusCode: number | null;
  data?: any;
}

/**
 * ChannelResponse Client DTO
 */
export interface ChannelResponseClientDTO {
  messageId: string | null;
  statusCode: number | null;
  data?: any;
  isSuccess: boolean;
  statusText: string;
}

/**
 * ChannelResponse Persistence DTO
 */
export interface ChannelResponsePersistenceDTO {
  messageId: string | null;
  statusCode: number | null;
  data: string | null; // JSON string
}

// ============ 实现类型 ============

export type ChannelResponse = IChannelResponse;
export type ChannelResponseClient = IChannelResponseClient;

// ============ Backward Compatibility ============

/**
 * @deprecated Use ChannelResponseDTO instead
 */
export type ChannelResponseServerDTO = ChannelResponseDTO;

/**
 * @deprecated Use IChannelResponse instead
 */
export type IChannelResponseServer = IChannelResponse;

/**
 * @deprecated Use ChannelResponse instead
 */
export type ChannelResponseServer = ChannelResponse;

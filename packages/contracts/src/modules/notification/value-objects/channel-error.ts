/**
 * ChannelError Value Object
 * 渠道错误值对象
 */

// ============ 接口定义 ============

/**
 * ChannelError Server Interface
 */
export interface IChannelError {
  code: string;
  message: string;
  details?: any;

  // 值对象方法
  with(
    updates: Partial<
      Omit<
        IChannelError,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IChannelError;

  // DTO 转换方法
}

/**
 * ChannelError Client Interface
 */
export interface IChannelErrorClient {
  code: string;
  message: string;
  details?: any;

  // UI 计算属性
  displayMessage: string; // 用户友好的错误消息
  isRetryable: boolean; // 是否可重试

  // 值对象方法

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * ChannelError DTO (Server)
 */
export interface ChannelErrorDTO {
  code: string;
  message: string;
  details?: any;
}

/**
 * ChannelError Client DTO
 */
export interface ChannelErrorClientDTO {
  code: string;
  message: string;
  details?: any;
  displayMessage: string;
  isRetryable: boolean;
}

/**
 * ChannelError Persistence DTO
 */
export interface ChannelErrorPersistenceDTO {
  code: string;
  message: string;
  details: string | null; // JSON string
}

// ============ 实现类型 ============

export type ChannelError = IChannelError;
export type ChannelErrorClient = IChannelErrorClient;

// ============ Backward Compatibility ============

/**
 * @deprecated Use ChannelErrorDTO instead
 */
export type ChannelErrorServerDTO = ChannelErrorDTO;

/**
 * @deprecated Use IChannelError instead
 */
export type IChannelErrorServer = IChannelError;

/**
 * @deprecated Use ChannelError instead
 */
export type ChannelErrorServer = ChannelError;

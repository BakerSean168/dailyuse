/**
 * ChannelError Value Object
 * 渠道错误值对象
 */

// ============ 接口定义 ============

/**
 * ChannelError 接口
 */
export interface ChannelError {
  code: string;
  message: string;
  details?: unknown;
}

// ============ DTO 定义 ============

/**
 * ChannelError DTO (传输层)
 */
export interface ChannelErrorDTO {
  code: string;
  message: string;
  details?: unknown;
}


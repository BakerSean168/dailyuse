/**
 * ChannelError Value Object
 * 渠道错误值对象
 *
 * Residual 849: ChannelErrorDTO dual retired — sole ChannelError interface + type alias.
 */

// Residual 849: sole ChannelError body.
export interface ChannelError {
  code: string;
  message: string;
  details?: unknown;
}

// Residual 849: ChannelErrorDTO dual retired — DTO is the ChannelError shape.
export type ChannelErrorDTO = ChannelError;

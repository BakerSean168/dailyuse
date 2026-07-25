/**
 * ChannelResponse Value Object
 * 渠道响应值对象
 *
 * Residual 849: ChannelResponseDTO dual retired — sole ChannelResponse interface + type alias.
 */

// Residual 849: sole ChannelResponse body.
export interface ChannelResponse {
  messageId: string | null;
  statusCode: number | null;
  data?: unknown;
}

// Residual 849: ChannelResponseDTO dual retired — DTO is the ChannelResponse shape.
export type ChannelResponseDTO = ChannelResponse;

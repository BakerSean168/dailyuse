/**
 * ChannelResponse 值对象
 * 
 * 渠道响应：消息ID、状态码、数据
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  ChannelResponse as IChannelResponse,
  ChannelResponseDTO,
} from '@dailyuse/contracts/notification';

/**
 * ChannelResponse 值对象实现
 */
export class ChannelResponse extends ValueObject<ChannelResponseDTO> implements IChannelResponse {

  private constructor(props: ChannelResponseDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ChannelResponseDTO): ChannelResponse {
    return new ChannelResponse(props);
  }

  public static success(messageId: string, data?: unknown): ChannelResponse {
    return new ChannelResponse({
      messageId,
      statusCode: 200,
      data,
    });
  }

  public static failed(statusCode: number, data?: unknown): ChannelResponse {
    return new ChannelResponse({
      messageId: null,
      statusCode,
      data,
    });
  }

  public static fromDTO(dto: ChannelResponseDTO): ChannelResponse {
    return new ChannelResponse(dto);
  }

  // ================= Getters =================

  public get messageId(): string | null {
    return this.props.messageId;
  }

  public get statusCode(): number | null {
    return this.props.statusCode;
  }

  public get data(): unknown {
    return this.props.data;
  }

  // ================= 计算属性 =================

  public get isSuccess(): boolean {
    return this.props.statusCode !== null && 
           this.props.statusCode >= 200 && 
           this.props.statusCode < 300;
  }

  public get hasMessageId(): boolean {
    return this.props.messageId !== null;
  }

  public get hasData(): boolean {
    return this.props.data !== undefined;
  }

  // ================= 序列化 =================

  public toDTO(): ChannelResponseDTO {
    return { ...this.props };
  }
}

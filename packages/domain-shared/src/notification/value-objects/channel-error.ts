/**
 * ChannelError 值对象
 * 
 * 渠道错误：错误码、消息、详情
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  ChannelError as IChannelError,
  ChannelErrorDTO,
  ChannelErrorPersistenceDTO,
} from '@dailyuse/contracts/notification';

/**
 * ChannelError 值对象实现
 */
export class ChannelError extends ValueObject<ChannelErrorDTO> implements IChannelError {

  private constructor(props: ChannelErrorDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ChannelErrorDTO): ChannelError {
    this.validate(props);
    return new ChannelError(props);
  }

  public static of(code: string, message: string, details?: unknown): ChannelError {
    return ChannelError.create({ code, message, details });
  }

  public static fromDTO(dto: ChannelErrorDTO): ChannelError {
    return new ChannelError(dto);
  }

  public static fromPersistenceDTO(dto: ChannelErrorPersistenceDTO): ChannelError {
    return new ChannelError({
      code: dto.code,
      message: dto.message,
      details: dto.details ? JSON.parse(dto.details) : undefined,
    });
  }

  // ================= 校验 =================
  
  private static validate(props: ChannelErrorDTO): void {
    if (!props.code || props.code.trim().length === 0) {
      throw new Error('Error code is required');
    }
    if (!props.message || props.message.trim().length === 0) {
      throw new Error('Error message is required');
    }
  }

  // ================= Getters =================

  public get code(): string {
    return this.props.code;
  }

  public get message(): string {
    return this.props.message;
  }

  public get details(): unknown {
    return this.props.details;
  }

  // ================= 计算属性 =================

  public get hasDetails(): boolean {
    return this.props.details !== undefined;
  }

  public get isRetryable(): boolean {
    // 常见可重试错误码
    const retryableCodes = ['TIMEOUT', 'RATE_LIMITED', 'SERVICE_UNAVAILABLE'];
    return retryableCodes.includes(this.props.code);
  }

  // ================= 序列化 =================

  public toDTO(): ChannelErrorDTO {
    return { ...this.props };
  }

  public toPersistenceDTO(): ChannelErrorPersistenceDTO {
    return {
      code: this.props.code,
      message: this.props.message,
      details: this.props.details ? JSON.stringify(this.props.details) : null,
    };
  }
}

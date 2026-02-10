/**
 * RateLimit 值对象
 * 
 * 速率限制：每小时/每天最大通知数
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  RateLimit as IRateLimit,
  RateLimitDTO,
  RateLimitPersistenceDTO,
} from '@dailyuse/contracts/notification';

/**
 * RateLimit 值对象实现
 */
export class RateLimit extends ValueObject<RateLimitDTO> implements IRateLimit {

  private constructor(props: RateLimitDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: RateLimitDTO): RateLimit {
    this.validate(props);
    return new RateLimit(props);
  }

  public static createDefault(): RateLimit {
    return new RateLimit({
      enabled: true,
      maxPerHour: 10,
      maxPerDay: 50,
    });
  }

  public static createUnlimited(): RateLimit {
    return new RateLimit({
      enabled: false,
      maxPerHour: 0,
      maxPerDay: 0,
    });
  }

  public static fromDTO(dto: RateLimitDTO): RateLimit {
    return new RateLimit(dto);
  }

  public static fromPersistenceDTO(dto: RateLimitPersistenceDTO): RateLimit {
    return new RateLimit(dto);
  }

  // ================= 校验 =================
  
  private static validate(props: RateLimitDTO): void {
    if (props.enabled) {
      if (props.maxPerHour < 0) {
        throw new Error('maxPerHour must be non-negative');
      }
      if (props.maxPerDay < 0) {
        throw new Error('maxPerDay must be non-negative');
      }
      if (props.maxPerHour > props.maxPerDay && props.maxPerDay > 0) {
        throw new Error('maxPerHour cannot exceed maxPerDay');
      }
    }
  }

  // ================= Getters =================

  public get enabled(): boolean {
    return this.props.enabled;
  }

  public get maxPerHour(): number {
    return this.props.maxPerHour;
  }

  public get maxPerDay(): number {
    return this.props.maxPerDay;
  }

  // ================= 行为方法 =================

  public setEnabled(enabled: boolean): RateLimit {
    return new RateLimit({ ...this.props, enabled });
  }

  public setLimits(maxPerHour: number, maxPerDay: number): RateLimit {
    const newProps = { ...this.props, maxPerHour, maxPerDay };
    RateLimit.validate(newProps);
    return new RateLimit(newProps);
  }

  // ================= 计算属性 =================

  public get isUnlimited(): boolean {
    return !this.props.enabled;
  }

  public wouldExceed(currentHourCount: number, currentDayCount: number): boolean {
    if (!this.props.enabled) return false;
    return currentHourCount >= this.props.maxPerHour || 
           currentDayCount >= this.props.maxPerDay;
  }

  // ================= 序列化 =================

  public toDTO(): RateLimitDTO {
    return { ...this.props };
  }

  public toPersistenceDTO(): RateLimitPersistenceDTO {
    return { ...this.props };
  }
}

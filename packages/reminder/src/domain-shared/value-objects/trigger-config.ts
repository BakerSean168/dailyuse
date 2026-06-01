/**
 * TriggerConfig 值对象
 * 
 * 触发器配置：固定时间/间隔时间
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type {
  ITriggerConfig,
  TriggerConfigDTO,
  TriggerType,
  FixedTimeTrigger,
  IntervalTrigger,
} from '@dailyuse/contracts/reminder';

/**
 * TriggerConfig 值对象实现
 */
export class TriggerConfig extends ValueObject<TriggerConfigDTO> implements ITriggerConfig {

  private constructor(props: TriggerConfigDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: TriggerConfigDTO): TriggerConfig {
    return new TriggerConfig(props);
  }

  public static createFixedTime(time: string, timezone?: string): TriggerConfig {
    return new TriggerConfig({
      type: 'FixedTime',
      fixedTime: { time, timezone: timezone ?? null },
      interval: null,
    });
  }

  public static createInterval(minutes: number, startTime?: number): TriggerConfig {
    return new TriggerConfig({
      type: 'Interval',
      fixedTime: null,
      interval: { minutes, startTime: startTime ?? null },
    });
  }

  public static fromDTO(dto: TriggerConfigDTO): TriggerConfig {
    return new TriggerConfig(dto);
  }

  // ================= Getters =================

  public get type(): TriggerType {
    return this.props.type;
  }

  public get fixedTime(): FixedTimeTrigger | null {
    return this.props.fixedTime !== null ? { ...this.props.fixedTime } : null;
  }

  public get interval(): IntervalTrigger | null {
    return this.props.interval !== null ? { ...this.props.interval } : null;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<TriggerConfigDTO>,
  ): TriggerConfig {
    return new TriggerConfig({ ...this.props, ...updates });
  }

  public setFixedTime(time: string): TriggerConfig {
    if (this.props.type !== 'FixedTime' || !this.props.fixedTime) return this;
    return this.with({ fixedTime: { ...this.props.fixedTime, time } });
  }

  public setIntervalMinutes(minutes: number): TriggerConfig {
    if (this.props.type !== 'Interval' || !this.props.interval) return this;
    return this.with({ interval: { ...this.props.interval, minutes } });
  }

  // ================= 计算属性 =================

  public get isFixedTime(): boolean {
    return this.props.type === 'FixedTime';
  }

  public get isInterval(): boolean {
    return this.props.type === 'Interval';
  }

  // ================= 序列化 =================

  public toDTO(): TriggerConfigDTO {
    return {
      type: this.props.type,
      fixedTime: this.props.fixedTime !== null ? { ...this.props.fixedTime } : null,
      interval: this.props.interval !== null ? { ...this.props.interval } : null,
    };
  }

}

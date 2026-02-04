/**
 * TriggerConfig 值对象
 * 
 * 触发器配置：固定时间/间隔时间
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  ITriggerConfigServer,
  TriggerConfigServerDTO,
  TriggerConfigPersistenceDTO,
  TriggerType,
  FixedTimeTrigger,
  IntervalTrigger,
} from '@dailyuse/contracts/reminder';

/**
 * TriggerConfig 值对象实现
 */
export class TriggerConfig extends ValueObject<TriggerConfigServerDTO> implements ITriggerConfigServer {

  private constructor(props: TriggerConfigServerDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: TriggerConfigServerDTO): TriggerConfig {
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

  public static fromDTO(dto: TriggerConfigServerDTO): TriggerConfig {
    return new TriggerConfig(dto);
  }

  public static fromPersistenceDTO(dto: TriggerConfigPersistenceDTO): TriggerConfig {
    return new TriggerConfig({
      type: dto.type,
      fixedTime: dto.fixed_time !== null ? JSON.parse(dto.fixed_time) : null,
      interval: dto.interval !== null ? JSON.parse(dto.interval) : null,
    });
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
    updates: Partial<TriggerConfigServerDTO>,
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

  public get displayText(): string {
    if (this.props.type === 'FixedTime' && this.props.fixedTime) {
      return `每天 ${this.props.fixedTime.time}`;
    }
    if (this.props.type === 'Interval' && this.props.interval) {
      const minutes = this.props.interval.minutes;
      if (minutes < 60) {
        return `每 ${minutes} 分钟`;
      }
      const hours = Math.floor(minutes / 60);
      return `每 ${hours} 小时`;
    }
    return '未知';
  }

  // ================= 序列化 =================

  public toServerDTO(): TriggerConfigServerDTO {
    return {
      type: this.props.type,
      fixedTime: this.props.fixedTime !== null ? { ...this.props.fixedTime } : null,
      interval: this.props.interval !== null ? { ...this.props.interval } : null,
    };
  }

  public toPersistenceDTO(): TriggerConfigPersistenceDTO {
    return {
      type: this.props.type,
      fixed_time: this.props.fixedTime !== null ? JSON.stringify(this.props.fixedTime) : null,
      interval: this.props.interval !== null ? JSON.stringify(this.props.interval) : null,
    };
  }
}

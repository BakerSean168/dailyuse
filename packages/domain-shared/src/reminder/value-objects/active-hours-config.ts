/**
 * ActiveHoursConfig 值对象
 * 
 * 活跃时间段配置：限制提醒触发的时间范围
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  IActiveHoursConfigServer,
  ActiveHoursConfigServerDTO,
  ActiveHoursConfigPersistenceDTO,
} from '@dailyuse/contracts/reminder';

/**
 * ActiveHoursConfig 值对象实现
 */
export class ActiveHoursConfig extends ValueObject<ActiveHoursConfigServerDTO> implements IActiveHoursConfigServer {

  private constructor(props: ActiveHoursConfigServerDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ActiveHoursConfigServerDTO): ActiveHoursConfig {
    this.validate(props);
    return new ActiveHoursConfig(props);
  }

  public static createDefault(): ActiveHoursConfig {
    return new ActiveHoursConfig({
      enabled: true,
      startHour: 9,
      endHour: 21,
    });
  }

  public static createAllDay(): ActiveHoursConfig {
    return new ActiveHoursConfig({
      enabled: false,
      startHour: 0,
      endHour: 24,
    });
  }

  public static fromDTO(dto: ActiveHoursConfigServerDTO): ActiveHoursConfig {
    return new ActiveHoursConfig(dto);
  }

  public static fromPersistenceDTO(dto: ActiveHoursConfigPersistenceDTO): ActiveHoursConfig {
    return new ActiveHoursConfig({
      enabled: dto.enabled,
      startHour: dto.start_hour,
      endHour: dto.end_hour,
    });
  }

  // ================= 校验 =================
  
  private static validate(props: ActiveHoursConfigServerDTO): void {
    if (props.startHour < 0 || props.startHour > 23) {
      throw new Error('startHour must be between 0 and 23');
    }
    if (props.endHour < 0 || props.endHour > 24) {
      throw new Error('endHour must be between 0 and 24');
    }
  }

  // ================= Getters =================

  public get enabled(): boolean {
    return this.props.enabled;
  }

  public get startHour(): number {
    return this.props.startHour;
  }

  public get endHour(): number {
    return this.props.endHour;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<ActiveHoursConfigServerDTO>,
  ): ActiveHoursConfig {
    const newProps = { ...this.props, ...updates };
    ActiveHoursConfig.validate(newProps);
    return new ActiveHoursConfig(newProps);
  }

  public enable(): ActiveHoursConfig {
    return this.with({ enabled: true });
  }

  public disable(): ActiveHoursConfig {
    return this.with({ enabled: false });
  }

  public setHours(startHour: number, endHour: number): ActiveHoursConfig {
    return this.with({ startHour, endHour });
  }

  public isWithinActiveHours(hour: number): boolean {
    if (!this.props.enabled) return true;
    if (this.props.startHour <= this.props.endHour) {
      return hour >= this.props.startHour && hour < this.props.endHour;
    }
    // 跨夜情况 (如 22:00 - 06:00)
    return hour >= this.props.startHour || hour < this.props.endHour;
  }

  // ================= 计算属性 =================

  public get isDisabled(): boolean {
    return !this.props.enabled;
  }

  public get isAllDay(): boolean {
    return !this.props.enabled || (this.props.startHour === 0 && this.props.endHour === 24);
  }

  public get displayText(): string {
    if (!this.props.enabled) return '全天';
    const start = String(this.props.startHour).padStart(2, '0') + ':00';
    const end = String(this.props.endHour).padStart(2, '0') + ':00';
    return `${start} - ${end}`;
  }

  public get durationHours(): number {
    if (this.props.startHour <= this.props.endHour) {
      return this.props.endHour - this.props.startHour;
    }
    // 跨夜情况
    return 24 - this.props.startHour + this.props.endHour;
  }

  // ================= 序列化 =================

  public toServerDTO(): ActiveHoursConfigServerDTO {
    return { ...this.props };
  }

  public toPersistenceDTO(): ActiveHoursConfigPersistenceDTO {
    return {
      enabled: this.props.enabled,
      start_hour: this.props.startHour,
      end_hour: this.props.endHour,
    };
  }
}

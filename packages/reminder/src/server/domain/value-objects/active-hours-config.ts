/**
 * ActiveHoursConfig 值对象
 * 
 * 活跃时间段配置：限制提醒触发的时间范围
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@memoflow/utils/domain';
import type {
  IActiveHoursConfig,
  ActiveHoursConfigDTO,
} from '@memoflow/contracts/reminder';

/**
 * ActiveHoursConfig 值对象实现
 */
export class ActiveHoursConfig extends ValueObject<ActiveHoursConfigDTO> implements IActiveHoursConfig {

  private constructor(props: ActiveHoursConfigDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ActiveHoursConfigDTO): ActiveHoursConfig {
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

  public static fromDTO(dto: ActiveHoursConfigDTO): ActiveHoursConfig {
    return new ActiveHoursConfig(dto);
  }

  // ================= 校验 =================
  
  private static validate(props: ActiveHoursConfigDTO): void {
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
    updates: Partial<ActiveHoursConfigDTO>,
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

  public get durationHours(): number {
    if (this.props.startHour <= this.props.endHour) {
      return this.props.endHour - this.props.startHour;
    }
    // 跨夜情况
    return 24 - this.props.startHour + this.props.endHour;
  }

  // ================= 序列化 =================

  public toDTO(): ActiveHoursConfigDTO {
    return { ...this.props };
  }

}

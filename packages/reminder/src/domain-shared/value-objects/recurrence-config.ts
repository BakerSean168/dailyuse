/**
 * RecurrenceConfig 值对象
 * 
 * 重复配置：每日/每周/自定义日期重复
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  IRecurrenceConfigServer,
  RecurrenceConfigServerDTO,
  RecurrenceType,
  DailyRecurrence,
  WeeklyRecurrence,
  CustomDaysRecurrence,
  WeekDay,
} from '@dailyuse/contracts/reminder';

/**
 * RecurrenceConfig 值对象实现
 */
export class RecurrenceConfig extends ValueObject<RecurrenceConfigServerDTO> implements IRecurrenceConfigServer {

  private constructor(props: RecurrenceConfigServerDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: RecurrenceConfigServerDTO): RecurrenceConfig {
    return new RecurrenceConfig(props);
  }

  public static createDaily(interval: number = 1): RecurrenceConfig {
    return new RecurrenceConfig({
      type: 'Daily',
      daily: { interval },
      weekly: null,
      customDays: null,
    });
  }

  public static createWeekly(weekDays: WeekDay[], interval: number = 1): RecurrenceConfig {
    return new RecurrenceConfig({
      type: 'Weekly',
      daily: null,
      weekly: { interval, weekDays },
      customDays: null,
    });
  }

  public static createCustomDays(dates: number[]): RecurrenceConfig {
    return new RecurrenceConfig({
      type: 'CustomDays',
      daily: null,
      weekly: null,
      customDays: { dates },
    });
  }

  public static fromDTO(dto: RecurrenceConfigServerDTO): RecurrenceConfig {
    return new RecurrenceConfig(dto);
  }

  // ================= Getters =================

  public get type(): RecurrenceType {
    return this.props.type;
  }

  public get daily(): DailyRecurrence | null {
    return this.props.daily !== null ? { ...this.props.daily } : null;
  }

  public get weekly(): WeeklyRecurrence | null {
    return this.props.weekly !== null
      ? { interval: this.props.weekly.interval, weekDays: [...this.props.weekly.weekDays] }
      : null;
  }

  public get customDays(): CustomDaysRecurrence | null {
    return this.props.customDays !== null
      ? { dates: [...this.props.customDays.dates] }
      : null;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<RecurrenceConfigServerDTO>,
  ): RecurrenceConfig {
    return new RecurrenceConfig({ ...this.props, ...updates });
  }

  public setDailyInterval(interval: number): RecurrenceConfig {
    if (this.props.type !== 'Daily') return this;
    return this.with({ daily: { interval } });
  }

  public setWeekDays(weekDays: WeekDay[]): RecurrenceConfig {
    if (this.props.type !== 'Weekly' || !this.props.weekly) return this;
    return this.with({ weekly: { ...this.props.weekly, weekDays } });
  }

  // ================= 计算属性 =================

  public get isDaily(): boolean {
    return this.props.type === 'Daily';
  }

  public get isWeekly(): boolean {
    return this.props.type === 'Weekly';
  }

  public get isCustomDays(): boolean {
    return this.props.type === 'CustomDays';
  }

  public get displayText(): string {
    switch (this.props.type) {
      case 'Daily':
        const interval = this.props.daily?.interval ?? 1;
        return interval === 1 ? '每天' : `每 ${interval} 天`;
      case 'Weekly':
        const days = this.props.weekly?.weekDays ?? [];
        const dayNames = days.map(d => this.getWeekDayName(d)).join('、');
        return `每周${dayNames}`;
      case 'CustomDays':
        const count = this.props.customDays?.dates.length ?? 0;
        return `指定 ${count} 个日期`;
      default:
        return '未知';
    }
  }

  private getWeekDayName(day: WeekDay): string {
    const names: Record<WeekDay, string> = {
      Monday: '一',
      Tuesday: '二',
      Wednesday: '三',
      Thursday: '四',
      Friday: '五',
      Saturday: '六',
      Sunday: '日',
    };
    return names[day] || day;
  }

  // ================= 序列化 =================

  public toServerDTO(): RecurrenceConfigServerDTO {
    return {
      type: this.props.type,
      daily: this.props.daily !== null ? { ...this.props.daily } : null,
      weekly: this.props.weekly !== null
        ? { interval: this.props.weekly.interval, weekDays: [...this.props.weekly.weekDays] }
        : null,
      customDays: this.props.customDays !== null
        ? { dates: [...this.props.customDays.dates] }
        : null,
    };
  }
}

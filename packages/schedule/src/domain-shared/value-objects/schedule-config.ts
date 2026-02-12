/**
 * ScheduleConfig 值对象
 * 
 * 调度配置：Cron表达式、时区、日期范围、执行次数限制
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  IScheduleConfigServer,
  ScheduleConfigServerDTO,
  ScheduleConfigPersistenceDTO,
  Timezone,
} from '@dailyuse/contracts/schedule';

/**
 * ScheduleConfig 值对象实现
 */
export class ScheduleConfig extends ValueObject<ScheduleConfigServerDTO> implements IScheduleConfigServer {

  private constructor(props: ScheduleConfigServerDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ScheduleConfigServerDTO): ScheduleConfig {
    this.validate(props);
    return new ScheduleConfig(props);
  }

  public static createDefault(timezone: Timezone = 'Asia/Shanghai'): ScheduleConfig {
    return new ScheduleConfig({
      cronExpression: '0 9 * * *', // 每天9点
      timezone,
      startDate: null,
      endDate: null,
      maxExecutions: null,
    });
  }

  public static fromDTO(dto: ScheduleConfigServerDTO): ScheduleConfig {
    return new ScheduleConfig(dto);
  }

  public static fromPersistenceDTO(dto: ScheduleConfigPersistenceDTO): ScheduleConfig {
    return new ScheduleConfig({
      cronExpression: dto.cronExpression,
      timezone: dto.timezone as Timezone,
      startDate: dto.startDate,
      endDate: dto.endDate,
      maxExecutions: dto.maxExecutions,
    });
  }

  // ================= 校验 =================
  
  private static validate(props: ScheduleConfigServerDTO): void {
    if (!props.cronExpression || props.cronExpression.trim().length === 0) {
      throw new Error('Cron expression is required');
    }
    if (!props.timezone || props.timezone.trim().length === 0) {
      throw new Error('Timezone is required');
    }
  }

  // ================= Getters =================

  public get cronExpression(): string {
    return this.props.cronExpression;
  }

  public get timezone(): Timezone {
    return this.props.timezone;
  }

  public get startDate(): number | null {
    return this.props.startDate !== null ? new Date(this.props.startDate).getTime() : null;
  }

  public get endDate(): number | null {
    return this.props.endDate !== null ? new Date(this.props.endDate).getTime() : null;
  }

  public get maxExecutions(): number | null {
    return this.props.maxExecutions;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<Omit<IScheduleConfigServer, 'equals' | 'with' | 'calculateNextRun' | 'isExpired' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'>>,
  ): ScheduleConfig {
    // 将 number 时间戳转换为 ISO string
    const convertedUpdates: Partial<ScheduleConfigServerDTO> = {};
    
    if (updates.cronExpression !== undefined) {
      convertedUpdates.cronExpression = updates.cronExpression;
    }
    if (updates.timezone !== undefined) {
      convertedUpdates.timezone = updates.timezone;
    }
    if (updates.startDate !== undefined) {
      convertedUpdates.startDate = updates.startDate !== null 
        ? new Date(updates.startDate).toISOString() 
        : null;
    }
    if (updates.endDate !== undefined) {
      convertedUpdates.endDate = updates.endDate !== null 
        ? new Date(updates.endDate).toISOString() 
        : null;
    }
    if (updates.maxExecutions !== undefined) {
      convertedUpdates.maxExecutions = updates.maxExecutions;
    }
    
    const newProps = { ...this.props, ...convertedUpdates };
    ScheduleConfig.validate(newProps);
    return new ScheduleConfig(newProps);
  }

  public setCronExpression(cron: string): ScheduleConfig {
    return this.with({ cronExpression: cron });
  }

  public setTimezone(timezone: Timezone): ScheduleConfig {
    return this.with({ timezone });
  }

  public setDateRange(startDate: number | null, endDate: number | null): ScheduleConfig {
    return this.with({ startDate, endDate });
  }

  // ================= 计算属性 =================

  public get hasStartDate(): boolean {
    return this.props.startDate !== null;
  }

  public get hasEndDate(): boolean {
    return this.props.endDate !== null;
  }

  public get hasExecutionLimit(): boolean {
    return this.props.maxExecutions !== null;
  }

  public get isExpired(): boolean {
    if (this.props.endDate === null) return false;
    return new Date(this.props.endDate).getTime() < Date.now();
  }

  // ================= 序列化 =================

  public toServerDTO(): ScheduleConfigServerDTO {
    return { ...this.props };
  }

  public toPersistenceDTO(): ScheduleConfigPersistenceDTO {
    return {
      cronExpression: this.props.cronExpression,
      timezone: this.props.timezone,
      startDate: this.props.startDate,
      endDate: this.props.endDate,
      maxExecutions: this.props.maxExecutions,
    };
  }
}

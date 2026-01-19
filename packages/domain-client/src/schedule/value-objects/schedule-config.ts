/**
 * ScheduleConfigClient 值对象
 * 调度配置 - 客户端值对象
 * 实现 IScheduleConfigClient 接口
 */

import type { IScheduleConfigClient, ScheduleConfigClientDTO, ScheduleConfigServerDTO } from '@dailyuse/contracts/schedule';
import { Timezone } from '@dailyuse/contracts/schedule';
import { ValueObject } from '@dailyuse/utils';

/**
 * ScheduleConfigClient 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class ScheduleConfig extends ValueObject implements IScheduleConfigClient {
  public readonly cronExpression: string;
  public readonly timezone: Timezone;
  public readonly startDate: Date | null;
  public readonly endDate: Date | null;
  public readonly maxExecutions: number | null;

  constructor(params: {
    cronExpression: string;
    timezone: Timezone;
    startDate?: Date | null;
    endDate?: Date | null;
    maxExecutions?: number | null;
  }) {
    super();

    this.cronExpression = params.cronExpression;
    this.timezone = params.timezone;
    this.startDate = params.startDate ?? null;
    this.endDate = params.endDate ?? null;
    this.maxExecutions = params.maxExecutions ?? null;

    // 确保不可变
    Object.freeze(this);
  }

  // UI 辅助属性
  public get cronDescription(): string {
    // 简单的 Cron 表达式描述（可以使用 cronstrue 库）
    return `Cron: ${this.cronExpression}`;
  }

  public get timezoneDisplay(): string {
    const timezoneNames: Partial<Record<Timezone, string>> = {
      'Asia/Shanghai': '上海 (UTC+8)',
      'America/New_York': '纽约 (UTC-5)',
      'Europe/London': '伦敦 (UTC+0)',
      UTC: 'UTC (UTC+0)',
    };
    return timezoneNames[this.timezone] || this.timezone;
  }

  public get startDateFormatted(): string | null {
    if (!this.startDate) return null;
    return this.startDate.toLocaleString('zh-CN');
  }

  public get endDateFormatted(): string | null {
    if (!this.endDate) return null;
    return this.endDate.toLocaleString('zh-CN');
  }

  public get maxExecutionsFormatted(): string {
    if (this.maxExecutions === null) return '无限';
    return `${this.maxExecutions} 次`;
  }

  public get hasTimeWindow(): boolean {
    return this.startDate !== null || this.endDate !== null;
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ScheduleConfig)) {
      return false;
    }

    return (
      this.cronExpression === other.cronExpression &&
      this.timezone === other.timezone &&
      this.startDate?.getTime() === other.startDate?.getTime() &&
      this.endDate?.getTime() === other.endDate?.getTime() &&
      this.maxExecutions === other.maxExecutions
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): ScheduleConfigServerDTO {
    return {
      cronExpression: this.cronExpression,
      timezone: this.timezone,
      startDate: this.startDate ? this.startDate.toISOString() : null,
      endDate: this.endDate ? this.endDate.toISOString() : null,
      maxExecutions: this.maxExecutions,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: ScheduleConfigServerDTO): ScheduleConfig {
    return new ScheduleConfig({
      cronExpression: dto.cronExpression,
      timezone: dto.timezone,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      maxExecutions: dto.maxExecutions,
    });
  }

  /**
   * 从 Client DTO 创建值对象
   */
  public static fromClientDTO(dto: ScheduleConfigClientDTO): ScheduleConfig {
    return new ScheduleConfig({
      cronExpression: dto.cronExpression,
      timezone: dto.timezone,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      maxExecutions: dto.maxExecutions,
    });
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): ScheduleConfigClientDTO {
    return {
      cronExpression: this.cronExpression,
      timezone: this.timezone,
      startDate: this.startDate ? this.startDate.toISOString() : null,
      endDate: this.endDate ? this.endDate.toISOString() : null,
      maxExecutions: this.maxExecutions,
      cronDescription: this.cronDescription,
      timezoneDisplay: this.timezoneDisplay,
      startDateFormatted: this.startDateFormatted,
      endDateFormatted: this.endDateFormatted,
      maxExecutionsFormatted: this.maxExecutionsFormatted,
    };
  }

  /**
   * 创建默认配置
   */
  public static createDefault(): ScheduleConfig {
    return new ScheduleConfig({
      cronExpression: '0 0 * * *', // 每天午夜
      timezone: 'Asia/Shanghai' as Timezone,
      startDate: null,
      endDate: null,
      maxExecutions: null,
    });
  }
}

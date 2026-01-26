/**
 * ScheduleConfig 值对象
 * 调度配置 - 不可变值对象
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  ScheduleConfigClientDTO,
  ScheduleConfigPersistenceDTO,
  ScheduleConfigServer,
  ScheduleConfigServerDTO,
} from '@dailyuse/contracts/schedule';
import { Timezone } from '@dailyuse/contracts/schedule';

/**
 * ScheduleConfig 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class ScheduleConfig extends ValueObject implements ScheduleConfigServer {
  public readonly cronExpression: string;
  public readonly timezone: Timezone;
  public readonly startDate: number | null;
  public readonly endDate: number | null;
  public readonly maxExecutions: number | null;

  constructor(params: {
    cronExpression: string;
    timezone: Timezone;
    startDate?: number | null;
    endDate?: number | null;
    maxExecutions?: number | null;
  }) {
    super(); // 调用基类构造函数

    this.cronExpression = params.cronExpression;
    this.timezone = params.timezone;
    this.startDate = params.startDate ?? null;
    this.endDate = params.endDate ?? null;
    this.maxExecutions = params.maxExecutions ?? null;

    // 验证配置
    this.validateAndThrow();

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 验证配置有效性
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    // 验证 cron 表达式基本格式（实际验证将在运行时由 cron 调度器完成）
    if (!this.cronExpression || this.cronExpression.trim().length === 0) {
      errors.push('Cron expression cannot be empty');
    }

    // 验证日期范围
    if (this.startDate !== null && this.endDate !== null) {
      if (this.startDate >= this.endDate) {
        errors.push('Start date must be before end date');
      }
    }

    // 验证最大执行次数
    if (this.maxExecutions !== null && this.maxExecutions <= 0) {
      errors.push('Max executions must be greater than 0');
    }

    if (errors.length > 0) {
      // 为了兼容旧代码，这里抛出异常，但接口要求返回对象
      // 理想情况下应该只返回对象，不抛出异常
      // throw new Error(errors[0]);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 验证并抛出异常（兼容旧代码）
   */
  private validateAndThrow(): void {
    const result = this.validate();
    if (!result.isValid) {
      throw new Error(result.errors[0]);
    }
  }

  /**
   * 计算下次执行时间
   * TODO: 实现完整的 cron 表达式解析
   */
  public calculateNextRun(currentTime: number = Date.now()): number | null {
    // 暂时返回当前时间 + 1小时（占位实现）
    // 实际实现需要使用 cron 解析库
    const nextTime = currentTime + 3600000; // 1 hour

    // 检查是否超过结束日期
    if (this.endDate !== null && nextTime > this.endDate) {
      return null;
    }

    // 检查是否早于开始日期
    if (this.startDate !== null && nextTime < this.startDate) {
      return this.startDate;
    }

    return nextTime;
  }

  /**
   * 检查是否已过期
   */
  public isExpired(currentTime: number = Date.now()): boolean {
    if (this.endDate !== null && currentTime > this.endDate) {
      return true;
    }
    return false;
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      cronExpression: string;
      timezone: Timezone;
      startDate: number | null;
      endDate: number | null;
      maxExecutions: number | null;
    }>,
  ): ScheduleConfig {
    return new ScheduleConfig({
      cronExpression: changes.cronExpression ?? this.cronExpression,
      timezone: changes.timezone ?? this.timezone,
      startDate: changes.startDate !== undefined ? changes.startDate : this.startDate,
      endDate: changes.endDate !== undefined ? changes.endDate : this.endDate,
      maxExecutions:
        changes.maxExecutions !== undefined ? changes.maxExecutions : this.maxExecutions,
    });
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
      this.startDate === other.startDate &&
      this.endDate === other.endDate &&
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
      startDate: this.startDate ? new Date(this.startDate).toISOString() : null,
      endDate: this.endDate ? new Date(this.endDate).toISOString() : null,
      maxExecutions: this.maxExecutions,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): ScheduleConfigClientDTO {
    return {
      cronExpression: this.cronExpression,
      timezone: this.timezone,
      startDate: this.startDate ? new Date(this.startDate).toISOString() : null,
      endDate: this.endDate ? new Date(this.endDate).toISOString() : null,
      maxExecutions: this.maxExecutions,
      // UI 辅助属性
      cronDescription: this.cronExpression, // TODO: 解析 cron 表达式
      timezoneDisplay: this.timezone, // TODO: 格式化时区
      startDateFormatted: this.startDate ? new Date(this.startDate).toLocaleString() : null,
      endDateFormatted: this.endDate ? new Date(this.endDate).toLocaleString() : null,
      maxExecutionsFormatted: this.maxExecutions ? `${this.maxExecutions} 次` : '无限',
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): ScheduleConfigPersistenceDTO {
    return {
      cronExpression: this.cronExpression,
      timezone: this.timezone,
      startDate: this.startDate ? new Date(this.startDate).toISOString() : null,
      endDate: this.endDate ? new Date(this.endDate).toISOString() : null,
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
      startDate: dto.startDate ? new Date(dto.startDate).getTime() : null,
      endDate: dto.endDate ? new Date(dto.endDate).getTime() : null,
      maxExecutions: dto.maxExecutions,
    });
  }

  /**
   * 从 DTO 创建值对象 (兼容旧代码)
   */
  public static fromDTO(dto: any): ScheduleConfig {
    // 检查是否是 ServerDTO (string dates) 还是旧的 DTO (number dates)
    const startDate =
      typeof dto.startDate === 'string' ? new Date(dto.startDate).getTime() : dto.startDate;
    const endDate = typeof dto.endDate === 'string' ? new Date(dto.endDate).getTime() : dto.endDate;

    return new ScheduleConfig({
      cronExpression: dto.cronExpression,
      timezone: dto.timezone,
      startDate,
      endDate,
      maxExecutions: dto.maxExecutions,
    });
  }

  /**
   * 创建默认配置（每天 9:00 AM 执行）
   */
  public static createDefault(): ScheduleConfig {
    return new ScheduleConfig({
      cronExpression: '0 9 * * *', // 每天 9:00 AM
      timezone: 'Asia/Shanghai' as Timezone,
      startDate: null,
      endDate: null,
      maxExecutions: null,
    });
  }

  /**
   * 创建单次执行配置
   */
  public static createOneTime(
    executeAt: Date,
    timezone: Timezone = 'UTC' as Timezone,
  ): ScheduleConfig {
    const date = new Date(executeAt);
    const cronExpression = `${date.getUTCMinutes()} ${date.getUTCHours()} ${date.getUTCDate()} ${date.getUTCMonth() + 1} *`;

    return new ScheduleConfig({
      cronExpression,
      timezone,
      startDate: null,
      endDate: executeAt + 60000, // 1分钟后过期
      maxExecutions: 1,
    });
  }
}

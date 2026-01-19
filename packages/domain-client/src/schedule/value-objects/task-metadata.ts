/**
 * TaskMetadataClient 值对象
 * 任务元数据 - 客户端值对象
 * 实现 ITaskMetadataClient 接口
 */

import type { ITaskMetadataClient, TaskMetadataClientDTO, TaskMetadataServerDTO } from '@dailyuse/contracts/schedule';
import { TaskPriority } from '@dailyuse/contracts/schedule';
import { ValueObject } from '@dailyuse/utils';

/**
 * TaskMetadataClient 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class TaskMetadata extends ValueObject implements ITaskMetadataClient {
  public readonly payload: Record<string, any>;
  public readonly tags: string[];
  public readonly priority: TaskPriority;
  public readonly timeout: number | null;

  constructor(params: {
    payload?: Record<string, any>;
    tags?: string[];
    priority?: TaskPriority;
    timeout?: number | null;
  }) {
    super();

    this.payload = params.payload ?? {};
    this.tags = params.tags ?? [];
    this.priority = params.priority ?? ('normal' as TaskPriority);
    this.timeout = params.timeout ?? null;

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.payload);
    Object.freeze(this.tags);
  }

  // UI 辅助属性
  public get priorityDisplay(): string {
    const priorityMap: Record<TaskPriority, string> = {
      low: '低',
      normal: '普通',
      high: '高',
      urgent: '紧急',
    };
    return priorityMap[this.priority] || '普通';
  }

  public get priorityColor(): string {
    const colorMap: Record<TaskPriority, string> = {
      low: 'gray',
      normal: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return colorMap[this.priority] || 'blue';
  }

  public get tagsDisplay(): string {
    if (this.tags.length === 0) return '无标签';
    return this.tags.join(', ');
  }

  public get timeoutFormatted(): string {
    if (this.timeout === null) return '无限制';
    return this.formatMilliseconds(this.timeout);
  }

  public get payloadSummary(): string {
    const keys = Object.keys(this.payload);
    if (keys.length === 0) return '无数据';
    return `${keys.length} 个字段`;
  }

  private formatMilliseconds(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.floor(ms / 1000)}秒`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}分钟`;
    return `${Math.floor(ms / 3600000)}小时`;
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof TaskMetadata)) {
      return false;
    }

    return (
      JSON.stringify(this.payload) === JSON.stringify(other.payload) &&
      this.tags.length === other.tags.length &&
      this.tags.every((tag, index) => tag === other.tags[index]) &&
      this.priority === other.priority &&
      this.timeout === other.timeout
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): TaskMetadataServerDTO {
    return {
      payload: { ...this.payload },
      tags: [...this.tags],
      priority: this.priority,
      timeout: this.timeout,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: TaskMetadataServerDTO): TaskMetadata {
    return new TaskMetadata({
      payload: dto.payload,
      tags: dto.tags,
      priority: dto.priority,
      timeout: dto.timeout,
    });
  }

  /**
   * 从 Client DTO 创建值对象
   */
  public static fromClientDTO(dto: TaskMetadataClientDTO): TaskMetadata {
    return new TaskMetadata({
      payload: dto.payload,
      tags: dto.tags,
      priority: dto.priority,
      timeout: dto.timeout,
    });
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): TaskMetadataClientDTO {
    return {
      payload: { ...this.payload },
      tags: [...this.tags],
      priority: this.priority,
      timeout: this.timeout,
      priorityDisplay: this.priorityDisplay,
      priorityColor: this.priorityColor,
      tagsDisplay: this.tagsDisplay,
      timeoutFormatted: this.timeoutFormatted,
      payloadSummary: this.payloadSummary,
    };
  }

  /**
   * 创建默认元数据
   */
  public static createDefault(): TaskMetadata {
    return new TaskMetadata({
      payload: {},
      tags: [],
      priority: 'normal' as TaskPriority,
      timeout: null,
    });
  }
}

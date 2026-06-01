/**
 * TaskTemplateHistory 实体实现 (Server)
 * 任务模板历史记录 - 实体
 */

import { Entity } from '@dailyuse/utils/domain';
import { generateUUID } from '@dailyuse/utils/shared';

/**
 * Local DTO interfaces for TaskTemplateHistory
 */
export interface TaskTemplateHistoryServerDTO {
  id: string;
  templateId: string;
  action: string;
  changes: unknown;
  createdAt: number;
}

export interface TaskTemplateHistoryClientDTO {
  id: string;
  templateId: string;
  action: string;
  changes: unknown;
  createdAt: number;
}

/**
 * Internal state interface for TaskTemplateHistory
 */
export interface TaskTemplateHistoryState {
  id: string;
  templateId: string;
  action: string;
  changes: unknown;
  createdAt: Date;
}

/**
 * TaskTemplateHistory 实体
 *
 * DDD 实体特点：
 * - 有唯一标识符（uuid）
 * - 有生命周期
 * - 可变性
 */
export class TaskTemplateHistory extends Entity<string> {
  private _templateId: string;
  private _action: string;
  private _changes: unknown;
  private _createdAt: Date;

  private constructor(state: TaskTemplateHistoryState) {
    super(state.id);
    this._templateId = state.templateId;
    this._action = state.action;
    this._changes = state.changes;
    this._createdAt = state.createdAt;
  }

  // Getters


  public get templateId(): string {
    return this._templateId;
  }

  public get action(): string {
    return this._action;
  }

  public get changes(): unknown {
    return this._changes;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * DTO 转换
   */
  public toServerDTO(): TaskTemplateHistoryServerDTO {
    return {
      id: this.id,
      templateId: this._templateId,
      action: this._action,
      changes: this._changes,
      createdAt: this._createdAt.getTime(),
    };
  }

  public toClientDTO(): TaskTemplateHistoryClientDTO {
    return {
      id: this.id,
      templateId: this._templateId,
      action: this._action,
      changes: this._changes,
      createdAt: this._createdAt.getTime(),
    };
  }

  /**
   * 🏭 恢复工厂：从状态恢复实体
   */
  public static load(state: TaskTemplateHistoryState): TaskTemplateHistory {
    return new TaskTemplateHistory(state);
  }

  /**
   * 🏭 业务工厂：创建新的历史记录
   */
  public static create(params: {
    templateId: string;
    action: string;
    changes?: unknown;
  }): TaskTemplateHistory {
    return new TaskTemplateHistory({
      id: generateUUID(),
      templateId: params.templateId,
      action: params.action,
      changes: params.changes ?? null,
      createdAt: new Date(),
    });
  }
}

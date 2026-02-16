/**
 * TaskTemplateHistory 实体实现 (Server)
 * 任务模板历史记录 - 实体
 */

import { Entity, generateUUID } from '@dailyuse/utils';

/**
 * Local DTO interfaces for TaskTemplateHistory
 */
export interface TaskTemplateHistoryServerDTO {
  id: string;
  templateId: string;
  action: string;
  changes: any | null;
  createdAt: number;
}

export interface TaskTemplateHistoryClientDTO {
  id: string;
  templateId: string;
  action: string;
  changes: any | null;
  createdAt: number;
}

export interface TaskTemplateHistoryPersistenceDTO {
  id: string;
  templateId: string;
  action: string;
  changes: string | null;
  createdAt: number;
}

export interface TaskTemplateHistoryServer {
  id: string;
  templateId: string;
  action: string;
  changes: any | null;
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
export class TaskTemplateHistory extends Entity<string> implements TaskTemplateHistoryServer {
  private _templateId: string;
  private _action: string;
  private _changes: any | null;
  private _createdAt: Date;

  private constructor(params: {
    id?: string;
    templateId: string;
    action: string;
    changes?: any | null;
    createdAt: number;
  }) {
    super(params.id ?? generateUUID());
    this._templateId = params.templateId;
    this._action = params.action;
    this._changes = params.changes ?? null;
    this._createdAt = new Date(params.createdAt);
  }

  // Getters


  public get templateId(): string {
    return this._templateId;
  }

  public get action(): string {
    return this._action;
  }

  public get changes(): any | null {
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

  public toPersistenceDTO(): TaskTemplateHistoryPersistenceDTO {
    return {
      id: this.id,
      templateId: this._templateId,
      action: this._action,
      changes: this._changes ? JSON.stringify(this._changes) : null,
      createdAt: this._createdAt.getTime(),
    };
  }

  /**
   * 静态工厂方法
   */
  public static create(params: {
    templateId: string;
    action: string;
    changes?: any | null;
  }): TaskTemplateHistory {
    return new TaskTemplateHistory({
      templateId: params.templateId,
      action: params.action,
      changes: params.changes,
      createdAt: Date.now(),
    });
  }

  public static fromServerDTO(dto: TaskTemplateHistoryServerDTO): TaskTemplateHistory {
    return new TaskTemplateHistory({
      id: dto.id,
      templateId: dto.templateId,
      action: dto.action,
      changes: dto.changes,
      createdAt: dto.createdAt,
    });
  }

  public static fromPersistenceDTO(dto: TaskTemplateHistoryPersistenceDTO): TaskTemplateHistory {
    return new TaskTemplateHistory({
      id: dto.id,
      templateId: dto.templateId,
      action: dto.action,
      changes: dto.changes ? JSON.parse(dto.changes) : null,
      createdAt: dto.createdAt,
    });
  }

  // Display text fields moved to frontend i18n
}

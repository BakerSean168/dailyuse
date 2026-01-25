/**
 * TaskTemplateHistory 实体实现 (Server)
 * 任务模板历史记录 - 实体
 */

import type {
  TaskTemplateHistoryClientDTO,
  TaskTemplateHistoryPersistenceDTO,
  TaskTemplateHistoryServer,
  TaskTemplateHistoryServerDTO,
} from '@dailyuse/contracts/task';
import { Entity } from '@dailyuse/utils';

/**
 * TaskTemplateHistory 实体
 *
 * DDD 实体特点：
 * - 有唯一标识符（uuid）
 * - 有生命周期
 * - 可变性
 */
export class TaskTemplateHistory extends Entity implements TaskTemplateHistoryServer {
  private _templateUuid: string;
  private _action: string;
  private _changes: any | null;
  private _createdAt: Date;

  private constructor(params: {
    uuid?: string;
    templateUuid: string;
    action: string;
    changes?: any | null;
    createdAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._templateUuid = params.templateUuid;
    this._action = params.action;
    this._changes = params.changes ?? null;
    this._createdAt = params.createdAt;
  }

  // Getters
  public override get uuid(): string {
    return this._uuid;
  }

  public get templateUuid(): string {
    return this._templateUuid;
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
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      action: this._action,
      changes: this._changes,
      createdAt: this._createdAt.getTime(),
    };
  }

  public toClientDTO(): TaskTemplateHistoryClientDTO {
    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      action: this._action,
      changes: this._changes,
      createdAt: this._createdAt.getTime(),
    };
  }

  public toPersistenceDTO(): TaskTemplateHistoryPersistenceDTO {
    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      action: this._action,
      changes: this._changes ? JSON.stringify(this._changes) : null,
      createdAt: this._createdAt.getTime(),
    };
  }

  /**
   * 静态工厂方法
   */
  public static create(params: {
    templateUuid: string;
    action: string;
    changes?: any | null;
  }): TaskTemplateHistory {
    return new TaskTemplateHistory({
      templateUuid: params.templateUuid,
      action: params.action,
      changes: params.changes,
      createdAt: new Date(),
    });
  }

  public static fromServerDTO(dto: TaskTemplateHistoryServerDTO): TaskTemplateHistory {
    return new TaskTemplateHistory({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      action: dto.action,
      changes: dto.changes,
      createdAt: new Date(dto.createdAt),
    });
  }

  public static fromPersistenceDTO(dto: TaskTemplateHistoryPersistenceDTO): TaskTemplateHistory {
    return new TaskTemplateHistory({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      action: dto.action,
      changes: dto.changes ? JSON.parse(dto.changes) : null,
      createdAt: new Date(dto.createdAt),
    });
  }

  // Display text fields moved to frontend i18n
}

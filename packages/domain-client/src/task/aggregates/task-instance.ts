/**
 * TaskInstance Aggregate Root - Domain Client
 * 任务实例聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 TaskInstanceClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: TaskInstanceClientDTO): TaskInstance
 * - Instance toDTO(): TaskInstanceClientDTO
 */

import type {
  TaskInstanceClient,
  TaskInstanceClientDTO,
  TaskTimeConfig,
  TaskTimeConfigDTO,
  TaskInstanceStatus,
} from '@dailyuse/contracts/task';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot } from '@dailyuse/utils';
import { TaskInstanceId, TaskTemplateId } from '@dailyuse/domain-shared/task';
import { IdentityId } from '@dailyuse/domain-shared';

export class TaskInstance extends AggregateRoot<TaskInstanceId> implements TaskInstanceClient {
  // ================= 1. Backing Fields =================
  private _templateId: TaskTemplateId;
  private _identityId: IdentityId;
  private _instanceDate: Date;
  private _timeConfig: TaskTimeConfig;
  private _importance?: ImportanceLevel;
  private _priority?: number;
  private _status: TaskInstanceStatus;
  private _actualStartTime: Date | null;
  private _actualEndTime: Date | null;
  private _comment: string | null;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: TaskInstanceId;
    templateId: TaskTemplateId;
    identityId: IdentityId;
    instanceDate: Date;
    timeConfig: TaskTimeConfig;
    importance?: ImportanceLevel;
    priority?: number;
    status: TaskInstanceStatus;
    actualStartTime: Date | null;
    actualEndTime: Date | null;
    comment: string | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._templateId = params.templateId;
    this._identityId = params.identityId;
    this._instanceDate = params.instanceDate;
    this._timeConfig = params.timeConfig;
    this._importance = params.importance;
    this._priority = params.priority;
    this._status = params.status;
    this._actualStartTime = params.actualStartTime;
    this._actualEndTime = params.actualEndTime;
    this._comment = params.comment;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 3. Getters =================
  get templateId(): TaskTemplateId {
    return this._templateId;
  }

  get identityId(): IdentityId {
    return this._identityId;
  }

  get instanceDate(): Date {
    return this._instanceDate;
  }

  get timeConfig(): TaskTimeConfig {
    return this._timeConfig;
  }

  get importance(): ImportanceLevel | undefined {
    return this._importance;
  }

  get priority(): number | undefined {
    return this._priority;
  }

  get status(): TaskInstanceStatus {
    return this._status;
  }

  get actualStartTime(): Date | null {
    return this._actualStartTime;
  }

  get actualEndTime(): Date | null {
    return this._actualEndTime;
  }

  get comment(): string | null {
    return this._comment;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  get isCompleted(): boolean {
    return this._status === 'Completed';
  }

  get isSkipped(): boolean {
    return this._status === 'Skipped';
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: TaskInstanceClientDTO): TaskInstance {
    return new TaskInstance({
      id: TaskInstanceId.of(dto.id),
      templateId: TaskTemplateId.of(dto.templateId),
      identityId: IdentityId.of(dto.identityId),
      instanceDate: new Date(dto.instanceDate),
      timeConfig: TaskInstance.parseTimeConfig(dto.timeConfig),
      importance: dto.importance,
      priority: dto.priority,
      status: dto.status,
      actualStartTime: dto.actualStartTime ? new Date(dto.actualStartTime) : null,
      actualEndTime: dto.actualEndTime ? new Date(dto.actualEndTime) : null,
      comment: dto.comment,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  private static parseTimeConfig(dto: TaskTimeConfigDTO): TaskTimeConfig {
    return {
      timeType: dto.timeType,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      timePoint: dto.timePoint,
      timeRange: dto.timeRange,
    };
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): TaskInstanceClientDTO {
    return {
      id: String(this.id) as TaskInstanceClientDTO['id'],
      templateId: String(this._templateId) as TaskInstanceClientDTO['templateId'],
      identityId: String(this._identityId) as TaskInstanceClientDTO['identityId'],
      instanceDate: this._instanceDate.getTime(),
      timeConfig: this.serializeTimeConfig(this._timeConfig),
      importance: this._importance,
      priority: this._priority,
      status: this._status,
      actualStartTime: this._actualStartTime?.getTime() ?? null,
      actualEndTime: this._actualEndTime?.getTime() ?? null,
      comment: this._comment,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }

  private serializeTimeConfig(config: TaskTimeConfig): TaskTimeConfigDTO {
    return {
      timeType: config.timeType,
      startDate: config.startDate ? (config.startDate as Date).getTime() : null,
      timePoint: config.timePoint,
      timeRange: config.timeRange,
    };
  }
}

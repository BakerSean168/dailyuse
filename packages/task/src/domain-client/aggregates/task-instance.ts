/**
 * TaskInstance Aggregate Root - Domain Client
 * 任务实例聚合根 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with params object
 * - Public getters via this._props.xxx
 * - Static load(state: TaskInstanceState): TaskInstance
 * - Instance toDTO(): TaskInstanceClientDTO
 */

import type {
  TaskInstanceClientDTO,
  TaskTimeConfig,
  TaskTimeConfigDTO,
  TaskInstanceStatus,
} from '@dailyuse/contracts/task';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot } from '@dailyuse/utils/domain';
import { TaskInstanceId } from '../../domain-shared/value-objects/task-instance-id';
import { TaskTemplateId } from '../../domain-shared/value-objects/task-template-id';
import { IdentityId } from '@dailyuse/domain-shared';

export interface TaskInstanceState {
  id: TaskInstanceId;
  templateId: TaskTemplateId;
  identityId: IdentityId;
  instanceDate: Date;
  timeConfig: TaskTimeConfig;
  importance: ImportanceLevel | undefined;
  priority: number | undefined;
  status: TaskInstanceStatus;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  comment: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class TaskInstance extends AggregateRoot<TaskInstanceId> {
  // ================= 1. Props =================
  private readonly _props: TaskInstanceState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: TaskInstanceState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
  get templateId(): TaskTemplateId {
    return this._props.templateId;
  }

  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get instanceDate(): Date {
    return this._props.instanceDate;
  }

  get timeConfig(): TaskTimeConfig {
    return this._props.timeConfig;
  }

  get importance(): ImportanceLevel | undefined {
    return this._props.importance;
  }

  get priority(): number | undefined {
    return this._props.priority;
  }

  get status(): TaskInstanceStatus {
    return this._props.status;
  }

  get actualStartTime(): Date | null {
    return this._props.actualStartTime;
  }

  get actualEndTime(): Date | null {
    return this._props.actualEndTime;
  }

  get comment(): string | null {
    return this._props.comment;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  get isCompleted(): boolean {
    return this._props.status === 'Completed';
  }

  get isSkipped(): boolean {
    return this._props.status === 'Skipped';
  }

  // ================= 4. Factory Methods =================
  public static load(state: TaskInstanceState): TaskInstance {
    return new TaskInstance(state);
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): TaskInstanceClientDTO {
    return {
      id: String(this.id) as TaskInstanceClientDTO['id'],
      templateId: String(this._props.templateId) as TaskInstanceClientDTO['templateId'],
      identityId: String(this._props.identityId) as TaskInstanceClientDTO['identityId'],
      instanceDate: this._props.instanceDate.getTime(),
      timeConfig: this.serializeTimeConfig(this._props.timeConfig),
      importance: this._props.importance,
      priority: this._props.priority,
      status: this._props.status,
      actualStartTime: this._props.actualStartTime?.getTime() ?? null,
      actualEndTime: this._props.actualEndTime?.getTime() ?? null,
      comment: this._props.comment,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
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

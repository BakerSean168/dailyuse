import type { Instant } from '@memoflow/contracts/primitives';
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
} from '@memoflow/contracts/task';
import type { ImportanceLevel } from '@memoflow/contracts/shared';
import { AggregateRoot } from '@memoflow/utils/domain';
import { TaskInstanceId } from '../../server/domain/value-objects/task-instance-id';
import { TaskTemplateId } from '../../server/domain/value-objects/task-template-id';
import { IdentityId } from '@memoflow/domain-shared';

export interface TaskInstanceState {
  id: TaskInstanceId;
  templateId: TaskTemplateId;
  identityId: IdentityId;
  instanceDate: Instant;
  timeConfig: TaskTimeConfig;
  importance: ImportanceLevel | undefined;
  priority: number | undefined;
  status: TaskInstanceStatus;
  actualStartTime: Instant | null;
  actualEndTime: Instant | null;
  comment: string | null;
  version: number;
  createdAt: Instant;
  updatedAt: Instant;
  deletedAt: Instant | null;
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

  get instanceDate(): Instant {
    const v = this._props.instanceDate;
    return v as Instant;
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

  get actualStartTime(): Instant | null {
    const v = this._props.actualStartTime;
    if (v == null) return null;
    return v as Instant;
  }

  get actualEndTime(): Instant | null {
    const v = this._props.actualEndTime;
    if (v == null) return null;
    return v as Instant;
  }

  get comment(): string | null {
    return this._props.comment;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Instant {
    const v = this._props.createdAt;
    return v as Instant;
  }

  get updatedAt(): Instant {
    const v = this._props.updatedAt;
    return v as Instant;
  }

  get deletedAt(): Instant | null {
    const v = this._props.deletedAt;
    if (v == null) return null;
    return v as Instant;
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
      instanceDate: this._props.instanceDate,
      timeConfig: this.serializeTimeConfig(this._props.timeConfig),
      importance: this._props.importance,
      priority: this._props.priority,
      status: this._props.status,
      actualStartTime: this._props.actualStartTime ?? null,
      actualEndTime: this._props.actualEndTime ?? null,
      comment: this._props.comment,
      version: this._props.version,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt ?? null,
    };
  }

  private serializeTimeConfig(config: TaskTimeConfig): TaskTimeConfigDTO {
    return {
      timeType: config.timeType,
      startDate: config.startDate ? Number(config.startDate) : null,
      timePoint: config.timePoint,
      timeRange: config.timeRange,
    };
  }
}

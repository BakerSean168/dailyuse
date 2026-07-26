import type { Instant } from '@dailyuse/contracts/primitives';
/**
 * TaskFolder Aggregate Root - Domain Client
 * 任务文件夹聚合根 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with params object
 * - Public getters via this._props.xxx
 * - Static load(state: TaskFolderState): TaskFolder
 * - Instance toDTO(): TaskFolderClientDTO
 */

import type {
  TaskFolderClientDTO,
} from '@dailyuse/contracts/task';
import { AggregateRoot } from '@dailyuse/utils/domain';
import { TaskFolderId } from '../../server/domain/value-objects/task-folder-id';
import { IdentityId } from '@dailyuse/domain-shared';

export interface TaskFolderState {
  id: TaskFolderId;
  identityId: IdentityId;
  name: string;
  color: string | null;
  icon: string | null;
  order: number;
  version: number;
  createdAt: Instant;
  updatedAt: Instant;
  deletedAt: Instant | null;
}

export class TaskFolder extends AggregateRoot<TaskFolderId> {
  // ================= 1. Props =================
  private readonly _props: TaskFolderState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: TaskFolderState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get name(): string {
    return this._props.name;
  }

  get color(): string | null {
    return this._props.color;
  }

  get icon(): string | null {
    return this._props.icon;
  }

  get order(): number {
    return this._props.order;
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

  get displayName(): string {
    return this._props.name;
  }

  get displayIcon(): string {
    return this._props.icon ?? '📁';
  }

  // ================= 4. Factory Methods =================
  public static load(state: TaskFolderState): TaskFolder {
    return new TaskFolder(state);
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): TaskFolderClientDTO {
    return {
      id: this.id as TaskFolderClientDTO['id'],
      identityId: this._props.identityId as TaskFolderClientDTO['identityId'],
      name: this._props.name,
      color: this._props.color,
      icon: this._props.icon,
      order: this._props.order,
      version: this._props.version,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt ?? null,
    };
  }
}

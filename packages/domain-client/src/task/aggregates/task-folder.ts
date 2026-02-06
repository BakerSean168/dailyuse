/**
 * TaskFolder Aggregate Root - Domain Client
 * 任务文件夹聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 TaskFolderClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: TaskFolderClientDTO): TaskFolder
 * - Instance toDTO(): TaskFolderClientDTO
 */

import type {
  TaskFolderClient,
  TaskFolderClientDTO,
} from '@dailyuse/contracts/task';
import { AggregateRoot } from '@dailyuse/utils';
import { TaskFolderId } from '@dailyuse/domain-shared/task';
import { IdentityId } from '@dailyuse/domain-shared';

export class TaskFolder extends AggregateRoot<TaskFolderId> implements TaskFolderClient {
  // ================= 1. Props =================
  private readonly _props: TaskFolderClient;

  // ================= 2. Constructor (Private) =================
  private constructor(props: TaskFolderClient) {
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

  get displayName(): string {
    return this._props.name;
  }

  get displayIcon(): string {
    return this._props.icon ?? '📁';
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: TaskFolderClientDTO): TaskFolder {
    return new TaskFolder({
      id: TaskFolderId.of(dto.id as string),
      identityId: IdentityId.of(dto.identityId as string),
      name: dto.name,
      color: dto.color,
      icon: dto.icon,
      order: dto.order,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
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
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}

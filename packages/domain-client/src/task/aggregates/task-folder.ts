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
  // ================= 1. Backing Fields =================
  private _identityId: IdentityId;
  private _name: string;
  private _color: string | null;
  private _icon: string | null;
  private _order: number;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: TaskFolderId;
    identityId: IdentityId;
    name: string;
    color: string | null;
    icon: string | null;
    order: number;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._name = params.name;
    this._color = params.color;
    this._icon = params.icon;
    this._order = params.order;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 3. Getters =================
  get identityId(): IdentityId {
    return this._identityId;
  }

  get name(): string {
    return this._name;
  }

  get color(): string | null {
    return this._color;
  }

  get icon(): string | null {
    return this._icon;
  }

  get order(): number {
    return this._order;
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

  get displayName(): string {
    return this._name;
  }

  get displayIcon(): string {
    return this._icon ?? '📁';
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
      identityId: this._identityId as TaskFolderClientDTO['identityId'],
      name: this._name,
      color: this._color,
      icon: this._icon,
      order: this._order,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}

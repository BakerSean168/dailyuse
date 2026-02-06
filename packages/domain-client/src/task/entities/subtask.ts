/**
 * Subtask Entity - Domain Client
 * 子任务实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 SubtaskClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: SubtaskClientDTO): Subtask
 * - Instance toDTO(): SubtaskClientDTO
 */

import type {
  SubtaskClient,
  SubtaskClientDTO,
} from '@dailyuse/contracts/task';
import { Entity } from '@dailyuse/utils';

// Subtask uses a simple string ID since SubtaskClient doesn't have a branded ID type
type SubtaskId = string;

export class Subtask extends Entity<SubtaskId> implements SubtaskClient {
  // ================= 1. Backing Fields =================
  private _name: string;
  private _isCompleted: boolean;
  private _order: number;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: SubtaskId;
    name: string;
    isCompleted: boolean;
    order: number;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._name = params.name;
    this._isCompleted = params.isCompleted;
    this._order = params.order;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 3. Getters =================
  get name(): string {
    return this._name;
  }

  get isCompleted(): boolean {
    return this._isCompleted;
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

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: SubtaskClientDTO): Subtask {
    return new Subtask({
      id: dto.id,
      name: dto.name,
      isCompleted: dto.isCompleted,
      order: dto.order,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): SubtaskClientDTO {
    return {
      id: String(this.id),
      name: this._name,
      isCompleted: this._isCompleted,
      order: this._order,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}

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
import type { SubtaskId as ISubtaskId } from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils';
import { SubtaskId } from '@dailyuse/domain-shared/task';

// 内部状态接口
interface SubtaskState {
  id: SubtaskId;
  name: string;
  isCompleted: boolean;
  order: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Subtask extends Entity<ISubtaskId> implements SubtaskClient {
  // ================= 1. Props =================
  private readonly _props: SubtaskState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: SubtaskState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
  get name(): string {
    return this._props.name;
  }

  get isCompleted(): boolean {
    return this._props.isCompleted;
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

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: SubtaskClientDTO): Subtask {
    return new Subtask({
      id: SubtaskId.of(dto.id),
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
      id: this.id as string,
      name: this._props.name,
      isCompleted: this._props.isCompleted,
      order: this._props.order,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}

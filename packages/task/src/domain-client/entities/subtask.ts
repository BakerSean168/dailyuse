/**
 * Subtask Entity - Domain Client
 * 子任务实体 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with params object
 * - Public getters via this._props.xxx
 * - Static load(state: SubtaskState): Subtask
 * - Instance toDTO(): SubtaskClientDTO
 */

import type {
  SubtaskClientDTO,
} from '@dailyuse/contracts/task';
import type {SubtaskId as ISubtaskId, Instant} from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils/domain';
import { SubtaskId } from '../../server/domain/value-objects/subtask-id';

export interface SubtaskState {
  id: SubtaskId;
  name: string;
  isCompleted: boolean;
  order: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Subtask extends Entity<ISubtaskId> {
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

  get createdAt(): Instant {
    const v = this._props.createdAt;
    return (v instanceof Date ? v.getTime() : Number(v)) as Instant;
  }

  get updatedAt(): Instant {
    const v = this._props.updatedAt;
    return (v instanceof Date ? v.getTime() : Number(v)) as Instant;
  }

  get deletedAt(): Instant | null {
    const v = this._props.deletedAt;
    if (v == null) return null;
    return (v instanceof Date ? v.getTime() : Number(v)) as Instant;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  // ================= 4. Factory Methods =================
  public static load(state: SubtaskState): Subtask {
    return new Subtask(state);
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): SubtaskClientDTO {
    return {
      id: this.id as ISubtaskId,
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

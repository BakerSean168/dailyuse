import type { Instant } from '@dailyuse/contracts/primitives';
/**
 * KeyResult Entity - Domain Client
 * 关键成果实体 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static load(state: KeyResultState): KeyResult
 * - Instance toDTO(): KeyResultClientDTO
 */

import type { KeyResultClientDTO, KeyResultProgress } from '@dailyuse/contracts/goal';
import { Entity } from '@dailyuse/utils/domain';
import { KeyResultId } from '../../server/domain';

export interface KeyResultState {
  id: KeyResultId;
  title: string;
  description: string | null;
  progress: KeyResultProgress;
  weight: number;
  order: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class KeyResult extends Entity<KeyResultId> {
  // ================= 1. Props =================
  private readonly _props: KeyResultState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: KeyResultState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
  get title(): string {
    return this._props.title;
  }

  get description(): string | null {
    return this._props.description;
  }

  get progress(): KeyResultProgress {
    return this._props.progress;
  }

  get weight(): number {
    return this._props.weight;
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

  // 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  get progressPercentage(): number {
    const { initialValue, currentValue, targetValue } = this._props.progress;
    if (targetValue === initialValue) return currentValue >= targetValue ? 100 : 0;
    return Math.round(((currentValue - initialValue) / (targetValue - initialValue)) * 100);
  }

  // ================= 4. Factory Methods =================
  public static load(state: KeyResultState): KeyResult {
    return new KeyResult(state);
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): KeyResultClientDTO {
    return {
      id: this.id as KeyResultId,
      title: this._props.title,
      description: this._props.description,
      progress: { ...this._props.progress },
      weight: this._props.weight,
      order: this._props.order,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}

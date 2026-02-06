/**
 * KeyResult Entity - Domain Client
 * 关键成果实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 KeyResultClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: KeyResultClientDTO): KeyResult
 * - Instance toDTO(): KeyResultClientDTO
 */

import type {
  KeyResultClient,
  KeyResultClientDTO,
  KeyResultProgress,
} from '@dailyuse/contracts/goal';
import { Entity } from '@dailyuse/utils';
import { KeyResultId } from '@dailyuse/domain-shared/goal';

// 内部状态接口
interface KeyResultState {
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

export class KeyResult extends Entity<KeyResultId> implements KeyResultClient {
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

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
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
  public static fromDTO(dto: KeyResultClientDTO): KeyResult {
    return new KeyResult({
      id: KeyResultId.of(dto.id),
      title: dto.title,
      description: dto.description,
      progress: dto.progress,
      weight: dto.weight,
      order: dto.order,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): KeyResultClientDTO {
    return {
      id: String(this.id),
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

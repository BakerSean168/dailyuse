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
  KeyResultProgressDTO,
} from '@dailyuse/contracts/goal';
import { Entity } from '@dailyuse/utils';
import { KeyResultId } from '@dailyuse/domain-shared/goal';

export class KeyResult extends Entity<KeyResultId> implements KeyResultClient {
  // ================= 1. Backing Fields =================
  private _title: string;
  private _description: string | null;
  private _progress: KeyResultProgressDTO;
  private _weight: number;
  private _order: number;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: KeyResultId;
    title: string;
    description: string | null;
    progress: KeyResultProgressDTO;
    weight: number;
    order: number;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._title = params.title;
    this._description = params.description;
    this._progress = params.progress;
    this._weight = params.weight;
    this._order = params.order;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 3. Getters =================
  get title(): string {
    return this._title;
  }

  get description(): string | null {
    return this._description;
  }

  get progress(): KeyResultProgressDTO {
    return this._progress;
  }

  get weight(): number {
    return this._weight;
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

  // 计算属性
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  get progressPercentage(): number {
    const { initialValue, currentValue, targetValue } = this._progress;
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
      title: this._title,
      description: this._description,
      progress: { ...this._progress },
      weight: this._weight,
      order: this._order,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}

/**
 * SettingEntry Entity - Domain Client
 * 设置条目实体 - 领域客户端
 */

import { Entity } from '@dailyuse/utils';
import type {
  SettingEntryClient,
  SettingEntryClientDTO,
} from '@dailyuse/contracts/setting';
import { SettingCategory } from '@dailyuse/contracts/setting';
import { SettingEntryId } from '@dailyuse/domain-shared/setting';

export class SettingEntry extends Entity<SettingEntryId> implements SettingEntryClient {
  private _key: string;
  private _value: unknown;
  private _category: SettingCategory;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(params: {
    id: string;
    key: string;
    value: unknown;
    category: SettingCategory;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(SettingEntryId.of(params.id));
    this._key = params.key;
    this._value = params.value;
    this._category = params.category;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ===== Getters =====

  public get key(): string {
    return this._key;
  }

  public get value(): unknown {
    return this._value;
  }

  public get category(): SettingCategory {
    return this._category;
  }

  public get version(): number {
    return this._version;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // ===== Factory Methods =====

  public static fromDTO(dto: SettingEntryClientDTO): SettingEntry {
    return new SettingEntry({
      id: dto.id,
      key: dto.key,
      value: dto.value,
      category: dto.category,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ===== DTO Conversion =====

  public toDTO(): SettingEntryClientDTO {
    return {
      id: String(this.id),
      key: this._key,
      value: this._value,
      category: this._category,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}

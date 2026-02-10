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
import { SettingEntryId } from '@/domain-shared';

// 内部状态接口
interface SettingEntryState {
  id: SettingEntryId;
  key: string;
  value: unknown;
  category: SettingCategory;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class SettingEntry extends Entity<SettingEntryId> implements SettingEntryClient {
  private readonly _props: SettingEntryState;

  private constructor(props: SettingEntryState) {
    super(props.id);
    this._props = props;
  }

  // ===== Getters =====

  public get key(): string {
    return this._props.key;
  }

  public get value(): unknown {
    return this._props.value;
  }

  public get category(): SettingCategory {
    return this._props.category;
  }

  public get version(): number {
    return this._props.version;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  public get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // ===== Factory Methods =====

  public static fromDTO(dto: SettingEntryClientDTO): SettingEntry {
    return new SettingEntry({
      id: SettingEntryId.of(dto.id),
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
      key: this._props.key,
      value: this._props.value,
      category: this._props.category,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}

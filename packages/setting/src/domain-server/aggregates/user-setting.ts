/**
 * UserSetting Aggregate Root
 * 用户设置聚合根
 *
 * 使用 Registry-Based 设计，所有设置存储在 entries Map 中
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  TransferDate,
  PersistenceDate,
  DomainDate,
  SettingId as ISettingId,
  IdentityId,
} from '@dailyuse/contracts/primitives';
import type {
  UserSettingServer,
  UserSettingServerDTO,
  UserSettingPersistenceDTO,
  SettingEntryServer,
  SettingEntryServerDTO,
} from '@dailyuse/contracts/setting';
import { SettingId } from '@/domain-shared/value-objects/setting-id';
import { SettingEntryId } from '@/domain-shared/value-objects/setting-entry-id';
import { IdentityId as IdentityIdType } from '@dailyuse/domain-shared/shared';

// ============ Local SettingEntry Entity ============

interface SettingEntryParams {
  key: string;
  value: unknown;
  updatedAt?: DomainDate;
}

class SettingEntry implements SettingEntryServer {
  public readonly id: SettingEntryId;
  public readonly key: string;
  private _value: unknown;
  private _updatedAt: DomainDate;

  private constructor(id: SettingEntryId, params: SettingEntryParams) {
    this.id = id;
    this.key = params.key;
    this._value = params.value;
    this._updatedAt = params.updatedAt ?? new Date();
  }

  get value(): unknown {
    return this._value;
  }

  get updatedAt(): DomainDate {
    return this._updatedAt;
  }

  setValue(value: unknown): void {
    this._value = value;
    this._updatedAt = new Date();
  }

  static create(params: SettingEntryParams): SettingEntry {
    const id = SettingEntryId.of(SettingEntryId.generate());
    return new SettingEntry(id, params);
  }

  static fromDTO(dto: SettingEntryServerDTO): SettingEntry {
    const id = SettingEntryId.of(dto.id);
    return new SettingEntry(id, {
      key: dto.key,
      value: dto.value,
      updatedAt: new Date(dto.updatedAt),
    });
  }

  toDTO(): SettingEntryServerDTO {
    return {
      id: this.id,
      key: this.key,
      value: this._value,
      updatedAt: this._updatedAt.getTime() as TransferDate,
    };
  }
}

// ============ UserSetting Aggregate ============

/** 内部状态接口 for UserSetting */
interface UserSettingState {
  identityId: IdentityId;
  entries: Map<string, SettingEntry>;
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}

/**
 * 用户设置聚合根
 */
export class UserSetting extends AggregateRoot<ISettingId> implements UserSettingServer {
  // ===== 私有属性容器 =====
  private _props: UserSettingState;

  private constructor(
    id: ISettingId,
    params: {
      identityId: IdentityId;
      entries?: Map<string, SettingEntry>;
      version?: number;
      createdAt?: DomainDate;
      updatedAt?: DomainDate;
      deletedAt?: DomainDate | null;
    }
  ) {
    super(id);
    this._props = {
      identityId: params.identityId,
      entries: params.entries ?? new Map(),
      version: params.version ?? 1,
      createdAt: params.createdAt ?? new Date(),
      updatedAt: params.updatedAt ?? new Date(),
      deletedAt: params.deletedAt ?? null,
    };
  }

  // ========== Getters ==========

  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get entries(): Map<string, SettingEntryServer> {
    return new Map(this._props.entries);
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): DomainDate {
    return this._props.createdAt;
  }

  get updatedAt(): DomainDate {
    return this._props.updatedAt;
  }

  get deletedAt(): DomainDate | null {
    return this._props.deletedAt;
  }

  // ========== Entry Management ==========

  /**
   * 设置一个配置项
   */
  setValue(key: string, value: unknown): void {
    const existing = this._props.entries.get(key);
    if (existing) {
      existing.setValue(value);
    } else {
      const entry = SettingEntry.create({ key, value });
      this._props.entries.set(key, entry);
    }
    this._props.updatedAt = new Date();
  }

  /**
   * 获取配置值
   */
  getValue<T = unknown>(key: string): T | undefined {
    return this._props.entries.get(key)?.value as T | undefined;
  }

  /**
   * 获取配置值或默认值
   */
  getValueOrDefault<T>(key: string, defaultValue: T): T {
    const value = this.getValue<T>(key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * 检查配置是否存在
   */
  hasEntry(key: string): boolean {
    return this._props.entries.has(key);
  }

  /**
   * 删除配置
   */
  removeEntry(key: string): boolean {
    const deleted = this._props.entries.delete(key);
    if (deleted) {
      this._props.updatedAt = new Date();
    }
    return deleted;
  }

  /**
   * 批量设置配置
   */
  setValues(entries: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(entries)) {
      this.setValue(key, value);
    }
  }

  /**
   * 获取所有配置的key
   */
  getKeys(): string[] {
    return Array.from(this._props.entries.keys());
  }

  // ========== DTO 转换 ==========

  toServerDTO(): UserSettingServerDTO {
    const entriesArray: SettingEntryServerDTO[] = [];
    for (const entry of this._props.entries.values()) {
      entriesArray.push(entry.toDTO());
    }

    return {
      id: this.id,
      identityId: this._props.identityId,
      entries: JSON.stringify(entriesArray),
      version: this._props.version,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() as TransferDate : null,
    };
  }

  toClientDTO(): import('@dailyuse/contracts/setting').UserSettingClientDTO {
    const entriesArray: SettingEntryServerDTO[] = [];
    for (const entry of this._props.entries.values()) {
      entriesArray.push(entry.toDTO());
    }

    return {
      id: this.id,
      identityId: this._props.identityId,
      entries: JSON.stringify(entriesArray),
      version: this._props.version,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() as TransferDate : null,
    };
  }

  toPersistenceDTO(): UserSettingPersistenceDTO {
    const entriesArray: SettingEntryServerDTO[] = [];
    for (const entry of this._props.entries.values()) {
      entriesArray.push(entry.toDTO());
    }

    return {
      id: this.id,
      identityId: this._props.identityId,
      entries: JSON.stringify(entriesArray),
      version: this._props.version,
      createdAt: this._props.createdAt as PersistenceDate,
      updatedAt: this._props.updatedAt as PersistenceDate,
      deletedAt: this._props.deletedAt as PersistenceDate | null,
    };
  }

  // ========== 静态工厂方法 ==========

  static create(params: { identityId: IdentityId; initialEntries?: Record<string, unknown> }): UserSetting {
    const id = SettingId.of(SettingId.generate());
    const setting = new UserSetting(id, {
      identityId: params.identityId,
    });

    if (params.initialEntries) {
      setting.setValues(params.initialEntries);
    }

    return setting;
  }

  static fromServerDTO(dto: UserSettingServerDTO): UserSetting {
    const id = SettingId.of(dto.id);

    const entries = new Map<string, SettingEntry>();
    if (dto.entries) {
      try {
        const parsed = JSON.parse(dto.entries) as SettingEntryServerDTO[];
        for (const entryDTO of parsed) {
          const entry = SettingEntry.fromDTO(entryDTO);
          entries.set(entry.key, entry);
        }
      } catch {
        // Invalid entries JSON, use empty map
      }
    }

    return new UserSetting(id, {
      identityId: IdentityIdType.of(dto.identityId),
      entries,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  static fromPersistenceDTO(dto: UserSettingPersistenceDTO): UserSetting {
    const id = SettingId.of(dto.id);

    const entries = new Map<string, SettingEntry>();
    if (dto.entries) {
      try {
        const parsed = JSON.parse(dto.entries) as SettingEntryServerDTO[];
        for (const entryDTO of parsed) {
          // Handle both Date and number for updatedAt (persistence vs server DTO)
          const updatedAtValue = entryDTO.updatedAt;
          const updatedAtNum = typeof updatedAtValue === 'number'
            ? updatedAtValue
            : (updatedAtValue as unknown as Date).getTime();
          const entry = SettingEntry.fromDTO({
            ...entryDTO,
            updatedAt: updatedAtNum as TransferDate,
          });
          entries.set(entry.key, entry);
        }
      } catch {
        // Invalid entries JSON, use empty map
      }
    }

    return new UserSetting(id, {
      identityId: IdentityIdType.of(dto.identityId),
      entries,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}

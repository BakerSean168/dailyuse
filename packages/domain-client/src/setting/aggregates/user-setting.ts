/**
 * UserSetting Aggregate Root - Domain Client
 * 用户设置聚合根 - 领域客户端
 *
 * 使用 Registry-Based 设计，所有设置存储在 entries Map 中
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  SettingId as ISettingId,
  IdentityId,
} from '@dailyuse/contracts/primitives';
import type {
  UserSettingClient,
  UserSettingClientDTO,
  SettingEntryClient,
  SettingEntryClientDTO,
} from '@dailyuse/contracts/setting';
import { SettingId } from '@dailyuse/domain-shared/setting';
import { SettingEntry } from '../entities';

export class UserSetting extends AggregateRoot<ISettingId> implements UserSettingClient {
  private _identityId: IdentityId;
  private _entries: Map<string, SettingEntry>;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(params: {
    id: string;
    identityId: string;
    entries: Map<string, SettingEntry>;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(SettingId.of(params.id));
    this._identityId = params.identityId as IdentityId;
    this._entries = params.entries;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ===== Getters =====

  public get identityId(): IdentityId {
    return this._identityId;
  }

  public get entries(): Map<string, SettingEntryClient> {
    return new Map(this._entries);
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

  // ===== Entry Access =====

  /**
   * 获取指定 key 的设置值
   */
  public getValue<T = unknown>(key: string): T | undefined {
    const entry = this._entries.get(key);
    return entry?.value as T | undefined;
  }

  /**
   * 检查是否存在指定 key 的设置
   */
  public hasEntry(key: string): boolean {
    return this._entries.has(key);
  }

  /**
   * 获取指定 key 的设置条目
   */
  public getEntry(key: string): SettingEntryClient | undefined {
    return this._entries.get(key);
  }

  // ===== Factory Methods =====

  public static fromDTO(dto: UserSettingClientDTO): UserSetting {
    // Parse entries from JSON string
    const entriesData: SettingEntryClientDTO[] = dto.entries
      ? JSON.parse(dto.entries)
      : [];

    const entries = new Map<string, SettingEntry>();
    for (const entryDTO of entriesData) {
      entries.set(entryDTO.key, SettingEntry.fromDTO(entryDTO));
    }

    return new UserSetting({
      id: dto.id,
      identityId: dto.identityId,
      entries,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ===== DTO Conversion =====

  public toDTO(): UserSettingClientDTO {
    const entriesArray: SettingEntryClientDTO[] = [];
    for (const entry of this._entries.values()) {
      entriesArray.push(entry.toDTO());
    }

    return {
      id: String(this.id),
      identityId: String(this._identityId),
      entries: JSON.stringify(entriesArray),
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}

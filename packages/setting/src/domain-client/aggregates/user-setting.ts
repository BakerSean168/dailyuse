/**
 * UserSetting Aggregate Root - Domain Client
 * 用户设置聚合根 - 领域客户端
 *
 * 使用 Registry-Based 设计，所有设置存储在 entries Map 中
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  SettingId as ISettingId,
  IdentityId as IIdentityId,
} from '@dailyuse/contracts/primitives';
import type {
  UserSettingClient,
  UserSettingClientDTO,
  SettingEntryClient,
  SettingEntryClientDTO,
} from '@dailyuse/contracts/setting';
import { SettingId } from '@/domain-shared';
import { IdentityId } from '@dailyuse/domain-shared';
import { SettingEntry } from '../entities';

// 内部状态接口：使用 domain-shared 类类型
interface UserSettingState {
  id: SettingId;
  identityId: IdentityId;
  entries: Map<string, SettingEntry>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class UserSetting extends AggregateRoot<ISettingId> implements UserSettingClient {
  private readonly _props: UserSettingState;

  private constructor(props: UserSettingState) {
    super(props.id);
    this._props = props;
  }

  // ===== Getters =====

  public get identityId(): IIdentityId {
    return this._props.identityId;
  }

  public get entries(): Map<string, SettingEntryClient> {
    return new Map(this._props.entries);
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

  // ===== Entry Access =====

  /**
   * 获取指定 key 的设置值
   */
  public getValue<T = unknown>(key: string): T | undefined {
    const entry = this._props.entries.get(key);
    return entry?.value as T | undefined;
  }

  /**
   * 检查是否存在指定 key 的设置
   */
  public hasEntry(key: string): boolean {
    return this._props.entries.has(key);
  }

  /**
   * 获取指定 key 的设置条目
   */
  public getEntry(key: string): SettingEntryClient | undefined {
    return this._props.entries.get(key);
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
      id: SettingId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
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
    for (const entry of this._props.entries.values()) {
      entriesArray.push(entry.toDTO());
    }

    return {
      id: String(this.id),
      identityId: String(this._props.identityId),
      entries: JSON.stringify(entriesArray),
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}

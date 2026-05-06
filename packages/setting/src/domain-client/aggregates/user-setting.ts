/**
 * UserSetting Aggregate Root — Domain Client
 * 用户设置聚合根 — 客户端领域模型
 *
 * Client is read-only — changes go through API to server.
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  SettingId as ISettingId,
  IdentityId as IIdentityId,
} from '@dailyuse/contracts/primitives';
import type {
  UserSettingClientDTO,
  UserSettingPreferences,
  PreferenceCategory,
} from '@dailyuse/contracts/setting';
import { getDefaultPreferences, PREFERENCE_CATEGORIES } from '@dailyuse/contracts/setting';
import { SettingId } from '../../domain-shared/value-objects/setting-id';

// ═══════════════════ State Interface ═══════════════════

export interface UserSettingState {
  id: ISettingId;
  identityId: IIdentityId;
  preferences: UserSettingPreferences;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserSetting extends AggregateRoot<ISettingId> {
  private readonly _props: UserSettingState;

  private constructor(props: UserSettingState) {
    super(props.id);
    this._props = { ...props };
  }

  // ═══════════════════ Getters ═══════════════════

  get identityId(): IIdentityId {
    return this._props.identityId;
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

  /** Get preferences for a specific category */
  getCategory<K extends PreferenceCategory>(category: K): UserSettingPreferences[K] {
    return structuredClone(this._props.preferences[category]);
  }

  /** Get all preferences (deep copy) */
  toPreferences(): UserSettingPreferences {
    return structuredClone(this._props.preferences);
  }

  /** Get value by dot-notation key (e.g., 'appearance.theme') */
  getValue<T = unknown>(key: string): T | undefined {
    const dotIdx = key.indexOf('.');
    if (dotIdx === -1) return undefined;

    const category = key.substring(0, dotIdx);
    const field = key.substring(dotIdx + 1);

    if (!PREFERENCE_CATEGORIES.includes(category as PreferenceCategory)) {
      return undefined;
    }

    const obj = this._props.preferences[category as PreferenceCategory];
    return (obj as Record<string, unknown>)[field] as T | undefined;
  }

  // ═══════════════════ DTO Conversion ═══════════════════

  toDTO(): UserSettingClientDTO {
    return {
      id: this.id as ISettingId,
      identityId: this._props.identityId as IIdentityId,
      preferences: this.toPreferences(),
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }

  // ═══════════════════ Factory Methods ═══════════════════

  /** Create from ClientDTO (API response) */
  static fromDTO(dto: UserSettingClientDTO): UserSetting {
    const defaults = getDefaultPreferences();

    return new UserSetting({
      id: dto.id as ISettingId,
      identityId: dto.identityId as IIdentityId,
      preferences: dto.preferences ?? defaults,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /** Load from full state (for testing) */
  static load(state: UserSettingState): UserSetting {
    return new UserSetting(state);
  }

  /** Create with defaults (for testing) */
  static createDefault(identityId: string): UserSetting {
    const now = new Date();
    return new UserSetting({
      id: SettingId.generate(),
      identityId: identityId as IIdentityId,
      preferences: getDefaultPreferences(),
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }
}

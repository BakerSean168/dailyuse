/**
 * UserSetting 聚合根 — 用户设置 (Zod-first JSONB model)
 *
 * 【设计理念】
 * 采用「JSONB preferences」模型，所有偏好存储在单一 `preferences` 字段中。
 * 使用 `patchCategory()` 单一泛型方法替代 9 个 update*() 样板方法。
 * 所有验证由分类 Zod schema 驱动。
 *
 * 【核心能力】
 * - patchCategory(category, patch): 按分类更新设置
 * - get(key) / set(key, value): 按 registry key 访问
 * - resetCategory(category) / resetAll(): 重置
 * - toPreferences(): 导出偏好数据
 * - importPreferences(data): 导入
 * - toServerDTO() / toClientDTO(): DTO 转换
 *
 * 【扩展指南】
 * 添加新设置项：在对应分类的 Zod schema 中添加字段 + .default()
 * 添加新分类：创建新 schema + 添加到 UserPreferencesSchema + CATEGORY_SCHEMAS
 */

import { AggregateRoot } from '@dailyuse/utils/domain';
import type {
  SettingId as ISettingId,
  IdentityId,
  TransferDate,
  DomainDate,
} from '@dailyuse/contracts/primitives';
import type {
  UserSettingServerDTO,
  UserSettingClientDTO,
  SettingEventMap,
  UserSettingPreferences,
  PreferenceCategory,
} from '@dailyuse/contracts/setting';
import {
  getDefaultPreferences,
  PREFERENCE_CATEGORIES,
  validateSettingValue,
  validateCategoryPatch,
} from '@dailyuse/contracts/setting';
import { CATEGORY_SCHEMAS } from '@dailyuse/contracts/setting';
import { SettingId } from '../../domain-shared/value-objects/setting-id';
import { IdentityId as IdentityIdVO } from '@dailyuse/domain-shared/shared';
import {
  SettingValidationError,
  UnknownSettingKeyError,
  UnknownSettingCategoryError,
} from '../errors';

// ═══════════════════ State Interface ═══════════════════

/**
 * UserSetting 内部状态接口 — 简化为单一 preferences JSONB 字段
 */
export interface UserSettingState {
  id: ISettingId;
  identityId: IdentityId;
  preferences: UserSettingPreferences;
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
}

// ═══════════════════ Aggregate Root ═══════════════════

export class UserSetting extends AggregateRoot<ISettingId> {
  private _props: UserSettingState;

  private constructor(state: UserSettingState) {
    super(state.id);
    this._props = { ...state };
  }

  // ═══════════════════ Getters ═══════════════════

  get identityId(): IdentityId {
    return this._props.identityId;
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

  /** Get preferences for a specific category (defensive copy) */
  getCategory<K extends PreferenceCategory>(category: K): UserSettingPreferences[K] {
    return structuredClone(this._props.preferences[category]);
  }

  // ═══════════════════ Core Mutation: patchCategory ═══════════════════

  /**
   * Patch a specific category's settings with partial updates.
   * Validates via the category's Zod schema, merges, bumps version, emits event.
   */
  patchCategory<K extends PreferenceCategory>(
    category: K,
    patch: Partial<UserSettingPreferences[K]>,
  ): void {
    if (!PREFERENCE_CATEGORIES.includes(category)) {
      throw new UnknownSettingCategoryError(category);
    }

    const result = validateCategoryPatch(category, patch as Record<string, unknown>);
    if (!result.valid) {
      throw new SettingValidationError(category, result.error!);
    }

    const current = this._props.preferences[category];
    this._props.preferences = {
      ...this._props.preferences,
      [category]: { ...current, ...result.data },
    };
    this._props.version += 1;
    this.touch();

    this.addDomainEvent<SettingEventMap['setting:user-setting-patched']>(
      'setting:user-setting-patched',
      {
        identityId: this._props.identityId,
        category,
        changes: patch as Record<string, unknown>,
        newVersion: this._props.version,
      },
    );
  }

  // ═══════════════════ Key-Based Access ═══════════════════

  /**
   * Get a setting value by dot-notation key (e.g., 'appearance.theme')
   */
  get<T = unknown>(key: string): T | undefined {
    const [category, field] = this.parseKey(key);
    const categoryPrefs = this._props.preferences[category as PreferenceCategory] as
      | Record<string, unknown>
      | undefined;
    if (!categoryPrefs) return undefined;
    return categoryPrefs[field] as T | undefined;
  }

  /**
   * Set a single setting value by dot-notation key (validates via patchCategory)
   */
  set(key: string, value: unknown): void {
    const [category, field] = this.parseKey(key);
    this.patchCategory(category as PreferenceCategory, { [field]: value } as never);
  }

  // ═══════════════════ Reset ═══════════════════

  /**
   * Reset a specific category to its default values
   */
  resetCategory(category: PreferenceCategory): void {
    if (!PREFERENCE_CATEGORIES.includes(category)) {
      throw new UnknownSettingCategoryError(category);
    }
    const defaults = getDefaultPreferences();
    this._props.preferences = {
      ...this._props.preferences,
      [category]: structuredClone(defaults[category]),
    };
    this._props.version += 1;
    this.touch();

    this.addDomainEvent<SettingEventMap['setting:user-setting-reset']>('setting:user-setting-reset', {
      identityId: this._props.identityId,
      category,
    });
  }

  /**
   * Reset all settings to defaults
   */
  resetAll(): void {
    this._props.preferences = getDefaultPreferences();
    this._props.version += 1;
    this.touch();

    this.addDomainEvent<SettingEventMap['setting:user-setting-reset']>('setting:user-setting-reset', {
      identityId: this._props.identityId,
    });
  }

  // ═══════════════════ Export / Import ═══════════════════

  /**
   * Export all preferences (deep copy)
   */
  toPreferences(): UserSettingPreferences {
    return structuredClone(this._props.preferences);
  }

  /**
   * Import preferences — patches each provided category
   */
  importPreferences(data: Partial<UserSettingPreferences>): void {
    for (const category of PREFERENCE_CATEGORIES) {
      const patch = data[category];
      if (patch) {
        this.patchCategory(category, patch as never);
      }
    }
  }

  // ═══════════════════ DTO Conversion ═══════════════════

  toServerDTO(): UserSettingServerDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      preferences: this.toPreferences(),
      version: this._props.version,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
    };
  }

  toClientDTO(): UserSettingClientDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      preferences: this.toPreferences(),
      version: this._props.version,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
    };
  }

  // ═══════════════════ Factory Methods ═══════════════════

  /**
   * Create a new user setting with defaults
   */
  static create(params: {
    identityId: IdentityId | string;
    overrides?: Partial<UserSettingPreferences>;
  }): UserSetting {
    const id = SettingId.of(SettingId.generate());
    const identityId =
      typeof params.identityId === 'string'
        ? IdentityIdVO.of(params.identityId)
        : params.identityId;
    const defaults = getDefaultPreferences();
    const now = new Date();

    // Merge overrides into defaults per category
    const preferences: UserSettingPreferences = { ...defaults };
    if (params.overrides) {
      for (const cat of PREFERENCE_CATEGORIES) {
        if (params.overrides[cat]) {
          (preferences as Record<string, unknown>)[cat] = {
            ...defaults[cat],
            ...params.overrides[cat],
          };
        }
      }
    }

    const setting = new UserSetting({
      id,
      identityId,
      preferences,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    setting.addDomainEvent<SettingEventMap['setting:user-setting-created']>(
      'setting:user-setting-created',
      { identityId },
    );

    return setting;
  }

  /**
   * Load from persistence (no validation, no events)
   */
  static load(state: UserSettingState): UserSetting {
    return new UserSetting(state);
  }

  // ═══════════════════ Internal Helpers ═══════════════════

  private touch(): void {
    this._props.updatedAt = new Date();
  }

  private parseKey(key: string): [string, string] {
    const dotIndex = key.indexOf('.');
    if (dotIndex === -1) {
      throw new UnknownSettingKeyError(key);
    }
    return [key.substring(0, dotIndex), key.substring(dotIndex + 1)];
  }
}

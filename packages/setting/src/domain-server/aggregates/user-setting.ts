/**
 * UserSetting 聚合根 — 用户设置
 *
 * 【设计理念】
 * 采用「分类偏好」模型替代旧的「通用 Map<string, Entry>」模型。
 * 每个设置分类（appearance, locale, workflow 等）是一个 typed 对象，
 * 确保类型安全的同时保持简洁。
 *
 * 【核心能力】
 * - 按分类读取/更新设置：updateAppearance(), updateLocale() 等
 * - 按 registry key 读取/更新：get(), set()
 * - 重置为默认值：reset(), resetCategory()
 * - 导出/导入：toExportData(), importData()
 * - DTO 转换：toServerDTO(), toClientDTO()
 *
 * 【验证策略】
 * 所有值变更都通过 SETTING_REGISTRY 的 Zod schema 进行验证。
 * create() 使用默认值（已经通过 registry 验证），所以不重复验证。
 * set()/update*() 对输入值进行 schema 校验。
 *
 * 【扩展指南】
 * 添加新设置项：
 *   1. 在 contracts/preferences/types.ts 中添加字段到对应分类接口
 *   2. 在 contracts/preferences/defaults.ts 中添加默认值
 *   3. 在 contracts/configs/ 中添加 SETTING_REGISTRY 条目
 *   4. 在 Prisma schema 中添加列
 *   5. 完毕！聚合根自动支持新字段
 *
 * 添加新分类：
 *   1. 在 contracts/preferences/types.ts 中创建新接口 + 添加到 UserSettingPreferences
 *   2. 在 contracts/preferences/defaults.ts 中添加 DEFAULT_XXX 常量 + 更新 createDefaultPreferences
 *   3. 在本文件的 UserSettingState 中添加字段
 *   4. 添加 updateXxx() 方法
 *   5. 更新 toServerDTO/toClientDTO
 *   6. 更新 mappers
 */

import { AggregateRoot } from '@dailyuse/utils';
import type { SettingId as ISettingId, IdentityId, TransferDate, DomainDate } from '@dailyuse/contracts/primitives';
import type {
  UserSettingServerDTO,
  UserSettingClientDTO,
  SettingEventMap,
} from '@dailyuse/contracts/setting';
import type {
  AppearancePreferences,
  LocalePreferences,
  WorkflowPreferences,
  PrivacyPreferences,
  NotificationPreferences,
  EditorPreferences,
  ShortcutPreferences,
  ExperimentalPreferences,
  UIStatePreferences,
  UserSettingPreferences,
  PreferenceCategory,
} from '@dailyuse/contracts/setting';
import {
  createDefaultPreferences,
  PREFERENCE_CATEGORIES,
  validateSettingValue,
  SETTING_REGISTRY,
  getSettingsByCategory,
} from '@dailyuse/contracts/setting';
import { SettingId } from '@/domain-shared/value-objects/setting-id';
import { IdentityId as IdentityIdVO } from '@dailyuse/domain-shared/shared';
import {
  SettingValidationError,
  UnknownSettingKeyError,
  UnknownSettingCategoryError,
  UserSettingDeletedError,
} from '../errors';

// ═══════════════════ State Interface ═══════════════════

/**
 * UserSetting 内部状态接口
 * 自包含，所有字段明确且 typed
 */
export interface UserSettingState {
  id: ISettingId;
  identityId: IdentityId;

  // ─── 分类偏好 ────────────────
  appearance: AppearancePreferences;
  locale: LocalePreferences;
  workflow: WorkflowPreferences;
  privacy: PrivacyPreferences;
  notification: NotificationPreferences;
  editor: EditorPreferences;
  shortcuts: ShortcutPreferences;
  experimental: ExperimentalPreferences;
  ui: UIStatePreferences;

  // ─── 元数据 ──────────────────
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}

// ═══════════════════ Aggregate Root ═══════════════════

export class UserSetting extends AggregateRoot<ISettingId> {
  private _props: UserSettingState;

  // ─── Private Constructor ─────────────────────────────

  private constructor(state: UserSettingState) {
    super(state.id);
    this._props = { ...state };
  }

  // ═══════════════════ Getters ═══════════════════

  get identityId(): IdentityId { return this._props.identityId; }
  get version(): number { return this._props.version; }
  get createdAt(): DomainDate { return this._props.createdAt; }
  get updatedAt(): DomainDate { return this._props.updatedAt; }
  get deletedAt(): DomainDate | null { return this._props.deletedAt; }

  /** 外观设置 (defensive copy) */
  get appearance(): AppearancePreferences { return { ...this._props.appearance }; }
  /** 区域/本地化设置 */
  get locale(): LocalePreferences { return { ...this._props.locale }; }
  /** 工作流设置 */
  get workflow(): WorkflowPreferences { return { ...this._props.workflow }; }
  /** 隐私设置 */
  get privacy(): PrivacyPreferences { return { ...this._props.privacy }; }
  /** 通知设置 */
  get notification(): NotificationPreferences { return { ...this._props.notification }; }
  /** 编辑器设置 */
  get editor(): EditorPreferences { return { ...this._props.editor }; }
  /** 快捷键设置 */
  get shortcuts(): ShortcutPreferences {
    return { ...this._props.shortcuts, custom: { ...this._props.shortcuts.custom } };
  }
  /** 实验性功能 */
  get experimental(): ExperimentalPreferences {
    return { ...this._props.experimental, features: [...this._props.experimental.features] };
  }
  /** UI 状态偏好 */
  get ui(): UIStatePreferences { return { ...this._props.ui }; }

  // ═══════════════════ Category Update Methods ═══════════════════

  /**
   * 更新外观设置
   */
  updateAppearance(partial: Partial<AppearancePreferences>): void {
    this.ensureModifiable();
    this.validateCategoryPartial('appearance', partial);
    this._props.appearance = { ...this._props.appearance, ...partial };
    this.touch();
    this.addDomainEvent<SettingEventMap['setting:UserSettingUpdated']>(
      'setting:UserSettingUpdated',
      { identityId: this._props.identityId, changedKeys: this.partialToKeys('appearance', partial) },
    );
  }

  /**
   * 更新区域设置
   */
  updateLocale(partial: Partial<LocalePreferences>): void {
    this.ensureModifiable();
    this.validateCategoryPartial('locale', partial);
    this._props.locale = { ...this._props.locale, ...partial };
    this.touch();
    this.addDomainEvent<SettingEventMap['setting:UserSettingUpdated']>(
      'setting:UserSettingUpdated',
      { identityId: this._props.identityId, changedKeys: this.partialToKeys('locale', partial) },
    );
  }

  /**
   * 更新工作流设置
   */
  updateWorkflow(partial: Partial<WorkflowPreferences>): void {
    this.ensureModifiable();
    this.validateCategoryPartial('workflow', partial);
    this._props.workflow = { ...this._props.workflow, ...partial };
    this.touch();
    this.addDomainEvent<SettingEventMap['setting:UserSettingUpdated']>(
      'setting:UserSettingUpdated',
      { identityId: this._props.identityId, changedKeys: this.partialToKeys('workflow', partial) },
    );
  }

  /**
   * 更新隐私设置
   */
  updatePrivacy(partial: Partial<PrivacyPreferences>): void {
    this.ensureModifiable();
    this.validateCategoryPartial('privacy', partial);
    this._props.privacy = { ...this._props.privacy, ...partial };
    this.touch();
    this.addDomainEvent<SettingEventMap['setting:UserSettingUpdated']>(
      'setting:UserSettingUpdated',
      { identityId: this._props.identityId, changedKeys: this.partialToKeys('privacy', partial) },
    );
  }

  /**
   * 更新通知设置
   */
  updateNotification(partial: Partial<NotificationPreferences>): void {
    this.ensureModifiable();
    this.validateCategoryPartial('notification', partial);
    this._props.notification = { ...this._props.notification, ...partial };
    this.touch();
    this.addDomainEvent<SettingEventMap['setting:UserSettingUpdated']>(
      'setting:UserSettingUpdated',
      { identityId: this._props.identityId, changedKeys: this.partialToKeys('notification', partial) },
    );
  }

  /**
   * 更新编辑器设置
   */
  updateEditor(partial: Partial<EditorPreferences>): void {
    this.ensureModifiable();
    this.validateCategoryPartial('editor', partial);
    this._props.editor = { ...this._props.editor, ...partial };
    this.touch();
    this.addDomainEvent<SettingEventMap['setting:UserSettingUpdated']>(
      'setting:UserSettingUpdated',
      { identityId: this._props.identityId, changedKeys: this.partialToKeys('editor', partial) },
    );
  }

  /**
   * 更新快捷键设置
   */
  updateShortcuts(partial: Partial<ShortcutPreferences>): void {
    this.ensureModifiable();
    // shortcuts 的 custom 字段是 Record，不在 registry 中逐项验证
    if (partial.enabled !== undefined) {
      this.validateRegistryKey('shortcuts.enabled', partial.enabled);
    }
    this._props.shortcuts = {
      ...this._props.shortcuts,
      ...partial,
      custom: partial.custom
        ? { ...this._props.shortcuts.custom, ...partial.custom }
        : this._props.shortcuts.custom,
    };
    this.touch();
  }

  /**
   * 更新实验性功能设置
   */
  updateExperimental(partial: Partial<ExperimentalPreferences>): void {
    this.ensureModifiable();
    if (partial.enabled !== undefined) {
      this.validateRegistryKey('experimental.enabled', partial.enabled);
    }
    this._props.experimental = {
      ...this._props.experimental,
      ...partial,
      features: partial.features ?? this._props.experimental.features,
    };
    this.touch();
  }

  /**
   * 更新 UI 状态偏好
   */
  updateUI(partial: Partial<UIStatePreferences>): void {
    this.ensureModifiable();
    this.validateCategoryPartial('ui', partial);
    this._props.ui = { ...this._props.ui, ...partial };
    this.touch();
  }

  // ═══════════════════ Key-Based Access ═══════════════════

  /**
   * 通过 registry key 获取设置值
   * @param key 点分隔的 key，如 'appearance.theme'
   */
  get<T = unknown>(key: string): T | undefined {
    const [category, field] = this.parseKey(key);
    const categoryPrefs = this._props[category as keyof UserSettingPreferences] as unknown as Record<string, unknown> | undefined;
    if (!categoryPrefs) return undefined;
    return categoryPrefs[field] as T | undefined;
  }

  /**
   * 通过 registry key 设置值（带验证）
   * @param key 点分隔的 key，如 'appearance.theme'
   * @param value 新值
   */
  set(key: string, value: unknown): void {
    this.ensureModifiable();
    this.validateRegistryKey(key, value);

    const [category, field] = this.parseKey(key);
    const categoryPrefs = this._props[category as keyof UserSettingPreferences] as unknown as Record<string, unknown>;
    categoryPrefs[field] = value;
    this.touch();

    this.addDomainEvent<SettingEventMap['setting:UserSettingUpdated']>(
      'setting:UserSettingUpdated',
      { identityId: this._props.identityId, changedKeys: [key] },
    );
  }

  // ═══════════════════ Reset ═══════════════════

  /**
   * 重置单个设置项为默认值
   */
  resetKey(key: string): void {
    const definition = SETTING_REGISTRY[key];
    if (!definition) {
      throw new UnknownSettingKeyError(key);
    }
    this.set(key, definition.defaultValue);
  }

  /**
   * 重置整个分类为默认值
   */
  resetCategory(category: PreferenceCategory): void {
    this.ensureModifiable();
    if (!PREFERENCE_CATEGORIES.includes(category)) {
      throw new UnknownSettingCategoryError(category);
    }
    const defaults = createDefaultPreferences();
    const defaultCategory = defaults[category as keyof UserSettingPreferences];
    (this._props as unknown as Record<string, unknown>)[category] = { ...defaultCategory };
    this.touch();

    const changedKeys = getSettingsByCategory(this.mapCategoryToRegistryCategory(category))
      .map((d) => d.key);
    this.addDomainEvent<SettingEventMap['setting:UserSettingReset']>(
      'setting:UserSettingReset',
      { identityId: this._props.identityId, category },
    );
  }

  /**
   * 重置所有设置为默认值
   */
  resetAll(): void {
    this.ensureModifiable();
    const defaults = createDefaultPreferences();
    this._props.appearance = { ...defaults.appearance };
    this._props.locale = { ...defaults.locale };
    this._props.workflow = { ...defaults.workflow };
    this._props.privacy = { ...defaults.privacy };
    this._props.notification = { ...defaults.notification };
    this._props.editor = { ...defaults.editor };
    this._props.shortcuts = { ...defaults.shortcuts };
    this._props.experimental = { ...defaults.experimental };
    this._props.ui = { ...defaults.ui };
    this.touch();

    this.addDomainEvent<SettingEventMap['setting:UserSettingReset']>(
      'setting:UserSettingReset',
      { identityId: this._props.identityId },
    );
  }

  // ═══════════════════ Export / Import ═══════════════════

  /**
   * 导出所有偏好设置（纯数据，不含元数据）
   */
  toPreferences(): UserSettingPreferences {
    return {
      appearance: this.appearance,
      locale: this.locale,
      workflow: this.workflow,
      privacy: this.privacy,
      notification: this.notification,
      editor: this.editor,
      shortcuts: this.shortcuts,
      experimental: this.experimental,
      ui: this.ui,
    };
  }

  /**
   * 从导入数据覆盖偏好设置
   * 只覆盖提供的分类，未提供的保持不变
   */
  importPreferences(data: Partial<UserSettingPreferences>): void {
    this.ensureModifiable();
    if (data.appearance) this.updateAppearance(data.appearance);
    if (data.locale) this.updateLocale(data.locale);
    if (data.workflow) this.updateWorkflow(data.workflow);
    if (data.privacy) this.updatePrivacy(data.privacy);
    if (data.notification) this.updateNotification(data.notification);
    if (data.editor) this.updateEditor(data.editor);
    if (data.shortcuts) this.updateShortcuts(data.shortcuts);
    if (data.experimental) this.updateExperimental(data.experimental);
    if (data.ui) this.updateUI(data.ui);
  }

  // ═══════════════════ Soft Delete ═══════════════════

  delete(): void {
    this._props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this._props.deletedAt = null;
    this.touch();
  }

  // ═══════════════════ DTO Conversion ═══════════════════

  toServerDTO(): UserSettingServerDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      appearance: this.appearance,
      locale: this.locale,
      workflow: this.workflow,
      privacy: this.privacy,
      notification: this.notification,
      editor: this.editor,
      shortcuts: this.shortcuts,
      experimental: this.experimental,
      ui: this.ui,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
      deletedAt: this._props.deletedAt ? (this._props.deletedAt.getTime() as TransferDate) : null,
    };
  }

  toClientDTO(): UserSettingClientDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      appearance: this.appearance,
      locale: this.locale,
      workflow: this.workflow,
      privacy: this.privacy,
      notification: this.notification,
      editor: this.editor,
      shortcuts: this.shortcuts,
      experimental: this.experimental,
      ui: this.ui,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
      deletedAt: this._props.deletedAt ? (this._props.deletedAt.getTime() as TransferDate) : null,
    };
  }

  // ═══════════════════ Factory Methods ═══════════════════

  /**
   * 创建新用户设置（使用默认值）
   */
  static create(params: {
    identityId: IdentityId | string;
    overrides?: Partial<UserSettingPreferences>;
  }): UserSetting {
    const id = SettingId.of(SettingId.generate());
    const identityId = typeof params.identityId === 'string'
      ? IdentityIdVO.of(params.identityId)
      : params.identityId;
    const defaults = createDefaultPreferences();
    const now = new Date();

    const setting = new UserSetting({
      id,
      identityId,
      appearance: { ...defaults.appearance, ...params.overrides?.appearance },
      locale: { ...defaults.locale, ...params.overrides?.locale },
      workflow: { ...defaults.workflow, ...params.overrides?.workflow },
      privacy: { ...defaults.privacy, ...params.overrides?.privacy },
      notification: { ...defaults.notification, ...params.overrides?.notification },
      editor: { ...defaults.editor, ...params.overrides?.editor },
      shortcuts: { ...defaults.shortcuts, ...params.overrides?.shortcuts },
      experimental: { ...defaults.experimental, ...params.overrides?.experimental },
      ui: { ...defaults.ui, ...params.overrides?.ui },
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    setting.addDomainEvent<SettingEventMap['setting:UserSettingUpdated']>(
      'setting:UserSettingUpdated',
      { identityId, changedKeys: [] },
    );

    return setting;
  }

  /**
   * 从持久化数据重建（无验证、无事件）
   */
  static load(state: UserSettingState): UserSetting {
    return new UserSetting(state);
  }

  // ═══════════════════ Internal Helpers ═══════════════════

  private ensureModifiable(): void {
    if (this._props.deletedAt) {
      throw new UserSettingDeletedError(this._props.identityId);
    }
  }

  private touch(): void {
    this._props.updatedAt = new Date();
  }

  /**
   * 解析 dot-notation key: 'appearance.theme' → ['appearance', 'theme']
   */
  private parseKey(key: string): [string, string] {
    const dotIndex = key.indexOf('.');
    if (dotIndex === -1) {
      throw new UnknownSettingKeyError(key);
    }
    return [key.substring(0, dotIndex), key.substring(dotIndex + 1)];
  }

  /**
   * 验证单个 registry key 对应的值
   */
  private validateRegistryKey(key: string, value: unknown): void {
    const result = validateSettingValue(key, value);
    if (!result.valid) {
      throw new SettingValidationError(key, result.error!);
    }
  }

  /**
   * 验证分类下的 partial update 中的所有字段
   */
  private validateCategoryPartial(category: string, partial: Record<string, unknown>): void {
    for (const [field, value] of Object.entries(partial)) {
      if (value === undefined) continue;
      const registryKey = `${category}.${field}`;
      // 仅当 registry 中有该 key 的定义时才验证
      if (SETTING_REGISTRY[registryKey]) {
        this.validateRegistryKey(registryKey, value);
      }
    }
  }

  /**
   * 将 partial 对象的 keys 转换为 registry keys
   */
  private partialToKeys(category: string, partial: Record<string, unknown>): string[] {
    return Object.keys(partial)
      .filter((k) => partial[k] !== undefined)
      .map((k) => `${category}.${k}`);
  }

  /**
   * 将内部分类名映射到 SETTING_REGISTRY 的分类名
   * 内部: 'appearance' → Registry: 'APPEARANCE'
   */
  private mapCategoryToRegistryCategory(category: string): string {
    return category.toUpperCase();
  }
}

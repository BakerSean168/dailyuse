/**
 * UserSetting Aggregate Root — Domain Client
 * 用户设置聚合根 — 客户端领域模型
 *
 * 与 domain-server 版本保持相同的「分类偏好」模型。
 * 客户端只读 — 不发送领域事件，不做 Prisma 持久化。
 * 所有变更通过 API 请求到服务端完成。
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  SettingId as ISettingId,
  IdentityId as IIdentityId,
} from '@dailyuse/contracts/primitives';
import type {
  UserSettingClientDTO,
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
} from '@dailyuse/contracts/setting';
import { SettingId } from '@/domain-shared/value-objects/setting-id';

// ═══════════════════ State Interface ═══════════════════

export interface UserSettingState {
  id: ISettingId;
  identityId: IIdentityId;

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
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class UserSetting extends AggregateRoot<ISettingId> {
  private readonly _props: UserSettingState;

  private constructor(props: UserSettingState) {
    super(props.id);
    this._props = { ...props };
  }

  // ═══════════════════ Getters ═══════════════════

  get identityId(): IIdentityId { return this._props.identityId; }
  get version(): number { return this._props.version; }
  get createdAt(): Date { return this._props.createdAt; }
  get updatedAt(): Date { return this._props.updatedAt; }
  get deletedAt(): Date | null { return this._props.deletedAt; }

  get appearance(): AppearancePreferences { return { ...this._props.appearance }; }
  get locale(): LocalePreferences { return { ...this._props.locale }; }
  get workflow(): WorkflowPreferences { return { ...this._props.workflow }; }
  get privacy(): PrivacyPreferences { return { ...this._props.privacy }; }
  get notification(): NotificationPreferences { return { ...this._props.notification }; }
  get editor(): EditorPreferences { return { ...this._props.editor }; }
  get shortcuts(): ShortcutPreferences {
    return { ...this._props.shortcuts, custom: { ...this._props.shortcuts.custom } };
  }
  get experimental(): ExperimentalPreferences {
    return { ...this._props.experimental, features: [...this._props.experimental.features] };
  }
  get ui(): UIStatePreferences { return { ...this._props.ui }; }

  // ═══════════════════ Convenience Accessors ═══════════════════

  /** 获取指定分类的所有偏好 */
  getCategory<K extends PreferenceCategory>(category: K): UserSettingPreferences[K] {
    return { ...this._props[category] } as UserSettingPreferences[K];
  }

  /** 获取所有偏好 */
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

  /** 按 dot-notation key 获取值 (e.g., 'appearance.theme') */
  getValue<T = unknown>(key: string): T | undefined {
    const dotIdx = key.indexOf('.');
    if (dotIdx === -1) return undefined;

    const category = key.substring(0, dotIdx);
    const field = key.substring(dotIdx + 1);

    if (!PREFERENCE_CATEGORIES.includes(category as PreferenceCategory)) {
      return undefined;
    }

    const obj = this._props[category as PreferenceCategory];
    return (obj as unknown as Record<string, unknown>)[field] as T | undefined;
  }

  // ═══════════════════ DTO Conversion ═══════════════════

  toDTO(): UserSettingClientDTO {
    return {
      id: String(this.id) as ISettingId,
      identityId: String(this._props.identityId) as IIdentityId,
      ...this.toPreferences(),
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }

  // ═══════════════════ Factory Methods ═══════════════════

  /** 从 ClientDTO（API 响应）还原为客户端领域模型 */
  static fromDTO(dto: UserSettingClientDTO): UserSetting {
    const defaults = createDefaultPreferences();

    return new UserSetting({
      id: dto.id as ISettingId,
      identityId: dto.identityId as IIdentityId,
      appearance: dto.appearance ?? defaults.appearance,
      locale: dto.locale ?? defaults.locale,
      workflow: dto.workflow ?? defaults.workflow,
      privacy: dto.privacy ?? defaults.privacy,
      notification: dto.notification ?? defaults.notification,
      editor: dto.editor ?? defaults.editor,
      shortcuts: dto.shortcuts ?? defaults.shortcuts,
      experimental: dto.experimental ?? defaults.experimental,
      ui: dto.ui ?? defaults.ui,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt != null ? new Date(dto.deletedAt) : null,
    });
  }

  /** 从完整 state 构建（用于测试） */
  static load(state: UserSettingState): UserSetting {
    return new UserSetting(state);
  }

  /** 创建默认配置（用于测试） */
  static createDefault(identityId: string): UserSetting {
    const defaults = createDefaultPreferences();
    const now = new Date();
    return new UserSetting({
      id: SettingId.generate(),
      identityId: identityId as IIdentityId,
      ...defaults,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }
}

import type { UserSettingCreatedEvent } from '../domain/events/user-setting-created.event';
import type { UserSettingPatchedEvent } from '../domain/events/user-setting-patched.event';
import type { UserSettingResetEvent } from '../domain/events/user-setting-reset.event';
import type { SettingImportedEvent } from '../domain/events/setting-imported.event';

/**
 * Setting Module - Event Map
 * 设置模块 - 事件映射
 *
 * 事件命名规范：setting:{kebab-action-past-tense}
 * 参见：packages/contracts/src/modules/governance/protocol/governance-event-map.ts
 */
export type SettingEventMap = {
  'setting:user-setting-created': UserSettingCreatedEvent;
  'setting:user-setting-patched': UserSettingPatchedEvent;
  'setting:user-setting-reset': UserSettingResetEvent;
  'setting:setting-imported': SettingImportedEvent;
};


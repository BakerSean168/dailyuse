import type { UserSettingCreatedEvent } from '../domain/events/user-setting-created.event';
import type { UserSettingPatchedEvent } from '../domain/events/user-setting-patched.event';
import type { UserSettingResetEvent } from '../domain/events/user-setting-reset.event';
import type { SettingImportedEvent } from '../domain/events/setting-imported.event';

export type SettingEventMap = {
  'setting:UserSettingCreated': UserSettingCreatedEvent;
  'setting:UserSettingPatched': UserSettingPatchedEvent;
  'setting:UserSettingReset': UserSettingResetEvent;
  'setting:SettingImported': SettingImportedEvent;
};

import type {
  UserSettingCreatedEvent,
  UserSettingPatchedEvent,
  UserSettingResetEvent,
  SettingImportedEvent,
} from '../domain/events';

export type SettingEventMap = {
  'setting:UserSettingCreated': UserSettingCreatedEvent;
  'setting:UserSettingPatched': UserSettingPatchedEvent;
  'setting:UserSettingReset': UserSettingResetEvent;
  'setting:SettingImported': SettingImportedEvent;
};

import type {
  UserSettingUpdatedEvent,
  UserSettingResetEvent,
  SettingImportedEvent,
  AppConfigUpdatedEvent,
} from '../domain/events';

export type SettingEventMap = {
  'setting:UserSettingUpdated': UserSettingUpdatedEvent;
  'setting:UserSettingReset': UserSettingResetEvent;
  'setting:SettingImported': SettingImportedEvent;
  'setting:AppConfigUpdated': AppConfigUpdatedEvent;
};

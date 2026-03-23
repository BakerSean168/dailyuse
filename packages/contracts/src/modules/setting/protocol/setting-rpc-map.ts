import type {
  GetUserSettingPublic,
  GetUserSettingRes,
  PatchUserSettingReq,
  PatchUserSettingRes,
  ResetUserSettingPublic,
  ResetUserSettingRes,
  ExportSettingsReq,
  ExportSettingsRes,
  ImportSettingsReq,
  ImportSettingsRes,
} from '../api';

export type SettingRpcMap = {
  'setting:all': [GetUserSettingPublic, GetUserSettingRes];
  'setting:patch': [PatchUserSettingReq, PatchUserSettingRes];
  'setting:reset': [ResetUserSettingPublic, ResetUserSettingRes];
  'setting:export': [ExportSettingsReq, ExportSettingsRes];
  'setting:import': [ImportSettingsReq, ImportSettingsRes];
};

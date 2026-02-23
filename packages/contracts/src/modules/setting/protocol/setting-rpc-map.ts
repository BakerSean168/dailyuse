import type {
  GetUserSettingReq,
  GetUserSettingRes,
  PatchUserSettingReq,
  PatchUserSettingRes,
  ResetUserSettingReq,
  ResetUserSettingRes,
  ExportSettingsReq,
  ExportSettingsRes,
  ImportSettingsReq,
  ImportSettingsRes,
} from '../api';

export type SettingRpcMap = {
  'setting:get-user-setting': [GetUserSettingReq, GetUserSettingRes];
  'setting:patch-user-setting': [PatchUserSettingReq, PatchUserSettingRes];
  'setting:reset-user-setting': [ResetUserSettingReq, ResetUserSettingRes];
  'setting:export': [ExportSettingsReq, ExportSettingsRes];
  'setting:import': [ImportSettingsReq, ImportSettingsRes];
};

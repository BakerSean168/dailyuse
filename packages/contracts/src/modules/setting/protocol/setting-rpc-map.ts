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
  'setting:all': [GetUserSettingReq, GetUserSettingRes];
  'setting:patch': [PatchUserSettingReq, PatchUserSettingRes];
  'setting:reset': [ResetUserSettingReq, ResetUserSettingRes];
  'setting:export': [ExportSettingsReq, ExportSettingsRes];
  'setting:import': [ImportSettingsReq, ImportSettingsRes];
};

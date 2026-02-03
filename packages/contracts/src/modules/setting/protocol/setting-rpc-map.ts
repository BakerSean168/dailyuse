/**
 * Setting Module RPC Protocol Map
 * 设置模块的 RPC 接口定义
 */

import type {
  GetUserSettingRequest,
  UpdateSettingEntryRequest,
  BatchUpdateSettingEntriesRequest,
  DeleteSettingEntryRequest,
  QuerySettingEntriesRequest,
  ResetSettingRequest,
  UserSettingResponse,
  SettingEntryResponse,
  BatchUpdateResponse,
  SettingListResponse,
  SettingOperationResponse,
} from '../api';

// === Setting Module RPC Map ===
export type SettingRpcMap = {
  // === User Settings ===
  'setting:get-user-setting': [GetUserSettingRequest, UserSettingResponse];
  
  // === Setting Entry Operations ===
  'setting:update-entry': [UpdateSettingEntryRequest, SettingEntryResponse];
  'setting:batch-update-entries': [BatchUpdateSettingEntriesRequest, BatchUpdateResponse];
  'setting:delete-entry': [DeleteSettingEntryRequest, SettingOperationResponse];
  'setting:query-entries': [QuerySettingEntriesRequest, SettingListResponse];
  
  // === Settings Management ===
  'setting:reset': [ResetSettingRequest, SettingOperationResponse];
  'setting:export': [{}, { data: string; fileName: string }];
  'setting:import': [{ data: string; overwrite?: boolean }, { imported: number; skipped: number }];
};

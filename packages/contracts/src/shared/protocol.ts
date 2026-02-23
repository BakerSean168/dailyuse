import type { AccountEventMap, AccountRpcMap } from '../modules/account/protocol';
import type { AuthEventMap, AuthRpcMap } from '../modules/authentication/protocol';
import type { SettingEventMap, SettingRpcMap } from '../modules/setting/protocol';

// 1. 组装全局事件表 (Global Event Registry)
export type AppEventRegistry = 
  & AccountEventMap 
  & AuthEventMap
  & SettingEventMap
  & { 'system:ready': void; 'system:error': Error }; // 也可以加一些全局通用的

// 2. 组装全局 RPC 表 (Global RPC Registry)
export type AppRpcRegistry = 
  & AccountRpcMap 
  & AuthRpcMap
  & SettingRpcMap;

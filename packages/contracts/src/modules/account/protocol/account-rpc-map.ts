/**
 * Account RPC Map
 * 
 * Defines RPC operations for account module
 */
import type {
  CheckAvailabilityReq, CheckAvailabilityRes,
  CloseAccountReq, CloseAccountRes,
  GetAccountReq, GetAccountRes,
  UpdateAccountReq, UpdateAccountRes,
  UpdateAccountSettingsReq, UpdateAccountSettingsRes
} from '../api';

export type AccountRpcMap = {
  // Lifecycle
  'account:check-availability': [CheckAvailabilityReq, CheckAvailabilityRes];
  'account:close': [CloseAccountReq, CloseAccountRes];
  
  // Profile
  'account:get-my-profile': [GetAccountReq, GetAccountRes];
  'account:update-profile': [UpdateAccountReq, UpdateAccountRes];
  
  // Settings
  'account:update-settings': [UpdateAccountSettingsReq, UpdateAccountSettingsRes];
};

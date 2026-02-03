/**
 * Account RPC Map
 * 
 * Defines RPC operations for account module
 */
import type {
  CheckAvailabilityReq, CheckAvailabilityRes,
  CloseAccountReq, CloseAccountRes,
  GetMyProfileReq, GetMyProfileRes,
  GetPublicProfileReq, PublicProfileRes,
  UpdateProfileReq, UpdateProfileRes,
  UpdateSettingsReq, UpdateSettingsRes
} from '../api';

export type AccountRpcMap = {
  // Lifecycle
  'account:check-availability': [CheckAvailabilityReq, CheckAvailabilityRes];
  'account:close': [CloseAccountReq, CloseAccountRes];
  
  // Profile
  'account:get-my-profile': [GetMyProfileReq, GetMyProfileRes];
  'account:get-public-profile': [GetPublicProfileReq, PublicProfileRes];
  'account:update-profile': [UpdateProfileReq, UpdateProfileRes];
  
  // Settings
  'account:update-settings': [UpdateSettingsReq, UpdateSettingsRes];
};

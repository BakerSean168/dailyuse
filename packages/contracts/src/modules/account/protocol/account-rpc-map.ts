import type {
  CheckAvailabilityReq, CheckAvailabilityRes,
  CloseAccountReq, CloseAccountRes,
  GetAccountReq, GetAccountRes,
  UpdateAccountReq, UpdateAccountRes,
  UpdateAccountSettingsReq, UpdateAccountSettingsRes,
} from '../api';

/**
 * Account RPC Map
 */
export type AccountRpcMap = {
  'account:check-availability': [CheckAvailabilityReq, CheckAvailabilityRes];
  'account:close': [CloseAccountReq, CloseAccountRes];
  'account:get-my-profile': [GetAccountReq, GetAccountRes];
  'account:update-profile': [UpdateAccountReq, UpdateAccountRes];
  'account:update-settings': [UpdateAccountSettingsReq, UpdateAccountSettingsRes];
};

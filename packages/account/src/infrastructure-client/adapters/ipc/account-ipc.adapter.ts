/**
 * Account IPC Adapter
 *
 * IPC implementation of IAccountApiClient for Electron desktop apps.
 * Uses ResultIpcClient — all methods return Result<T> directly.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IAccountApiClient, IResultIpcClient } from '../types';
import type {
  AccountClientDTO,
  UpdateAccountReq,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
} from '@dailyuse/contracts/account';

const CHANNELS = {
  GET_PROFILE: 'account:get',
  GET_CURRENT: 'account:get-me',
  UPDATE_PROFILE: 'account:update-profile',
  CHECK_AVAILABILITY: 'account:check-availability',
  CLOSE_ACCOUNT: 'account:close',
} as const;

export class AccountIpcAdapter implements IAccountApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getMyProfile(): Promise<Result<AccountClientDTO>> {
    return this.ipcClient.invoke(CHANNELS.GET_CURRENT);
  }

  async updateMyProfile(request: UpdateAccountReq): Promise<Result<AccountClientDTO>> {
    return this.ipcClient.invoke(CHANNELS.UPDATE_PROFILE, request);
  }

  async checkAvailability(request: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>> {
    return this.ipcClient.invoke(CHANNELS.CHECK_AVAILABILITY, request);
  }

  async closeAccount(request: CloseAccountReq): Promise<Result<void>> {
    return this.ipcClient.invoke(CHANNELS.CLOSE_ACCOUNT, request);
  }
}

export function createAccountIpcAdapter(ipcClient: IResultIpcClient): IAccountApiClient {
  return new AccountIpcAdapter(ipcClient);
}

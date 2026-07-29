/**
 * Account IPC Adapter
 *
 * IPC implementation of IAccountApiClient for Electron desktop apps.
 * Uses ResultIpcClient — all methods return Result<T> directly.
 */

import type { Result } from '@memoflow/contracts/result';
import { AccountChannels } from '@memoflow/contracts/electron';
import type { IAccountApiClient, IResultIpcClient } from '../types';
import type {
  AccountClientDTO,
  UpdateAccountReq,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
  UpdateAccountSettingsReq,
  UpdateAccountSettingsRes,
} from '@memoflow/contracts/account';

export class AccountIpcAdapter implements IAccountApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getMyProfile(): Promise<Result<AccountClientDTO>> {
    return this.ipcClient.invoke(AccountChannels.GET_ME);
  }

  async updateMyProfile(request: UpdateAccountReq): Promise<Result<AccountClientDTO>> {
    return this.ipcClient.invoke(AccountChannels.UPDATE_PROFILE, request);
  }

  async updateSettings(
    request: UpdateAccountSettingsReq,
  ): Promise<Result<UpdateAccountSettingsRes>> {
    return this.ipcClient.invoke(AccountChannels.UPDATE_SETTINGS, request);
  }

  async checkAvailability(request: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>> {
    return this.ipcClient.invoke(AccountChannels.CHECK_AVAILABILITY, request);
  }

  async closeAccount(request: CloseAccountReq): Promise<Result<void>> {
    return this.ipcClient.invoke(AccountChannels.CLOSE, request);
  }
}

export function createAccountIpcAdapter(ipcClient: IResultIpcClient): IAccountApiClient {
  return new AccountIpcAdapter(ipcClient);
}

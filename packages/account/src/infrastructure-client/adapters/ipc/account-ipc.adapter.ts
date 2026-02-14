/**
 * Account IPC Adapter
 *
 * IPC implementation of IAccountApiClient for Electron desktop apps.
 * Uses tryCatch to wrap IPC calls into Result<T>.
 */

import type { Result } from '@dailyuse/contracts/result';
import { tryCatch } from '@dailyuse/contracts/result';
import type { IAccountApiClient, IIpcClient } from '../types';
import type {
  AccountClientDTO,
  UpdateAccountReq,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
} from '@dailyuse/contracts/account';

const CHANNELS = {
  GET_PROFILE: 'account:me:get',
  UPDATE_PROFILE: 'account:me:update',
  CHECK_AVAILABILITY: 'account:availability:check',
  CLOSE_ACCOUNT: 'account:me:close',
} as const;

export class AccountIpcAdapter implements IAccountApiClient {
  constructor(private readonly ipcClient: IIpcClient) {}

  async getMyProfile(): Promise<Result<AccountClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(CHANNELS.GET_PROFILE));
  }

  async updateMyProfile(request: UpdateAccountReq): Promise<Result<AccountClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(CHANNELS.UPDATE_PROFILE, request));
  }

  async checkAvailability(request: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>> {
    return tryCatch(() => this.ipcClient.invoke(CHANNELS.CHECK_AVAILABILITY, request));
  }

  async closeAccount(request: CloseAccountReq): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke(CHANNELS.CLOSE_ACCOUNT, request));
  }
}

export function createAccountIpcAdapter(ipcClient: IIpcClient): IAccountApiClient {
  return new AccountIpcAdapter(ipcClient);
}

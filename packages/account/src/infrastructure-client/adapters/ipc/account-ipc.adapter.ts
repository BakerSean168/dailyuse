/**
 * Account IPC Adapter
 *
 * IPC implementation of IAccountApiClient for Electron desktop apps.
 * 所有方法返回 Promise<Result<T>>，使用 tryCatch 包装 IPC 调用。
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
    return tryCatch(() => this.ipcClient.invoke<AccountClientDTO>(CHANNELS.GET_PROFILE));
  }

  async updateMyProfile(request: UpdateAccountReq): Promise<Result<AccountClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke<AccountClientDTO>(CHANNELS.UPDATE_PROFILE, request));
  }

  async checkAvailability(request: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>> {
    return tryCatch(() => this.ipcClient.invoke<CheckAvailabilityRes>(CHANNELS.CHECK_AVAILABILITY, request));
  }

  async closeAccount(request: CloseAccountReq): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke<void>(CHANNELS.CLOSE_ACCOUNT, request));
  }
}

export function createAccountIpcAdapter(ipcClient: IIpcClient): IAccountApiClient {
  return new AccountIpcAdapter(ipcClient);
}

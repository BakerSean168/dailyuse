/**
 * Account IPC Adapter
 *
 * IPC implementation of IAccountApiClient for Electron desktop apps.
 */

import type { IAccountApiClient } from '../../application-client';
import type {
  AccountClientDTO,
  UpdateAccountReq,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
} from '@dailyuse/contracts/account';

interface IpcApi {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
}

const CHANNELS = {
  GET_PROFILE: 'account:me:get',
  UPDATE_PROFILE: 'account:me:update',
  CHECK_AVAILABILITY: 'account:availability:check',
  CLOSE_ACCOUNT: 'account:me:close',
} as const;

export class AccountIpcAdapter implements IAccountApiClient {
  constructor(private readonly ipcApi: IpcApi) {}

  async getMyProfile(): Promise<AccountClientDTO> {
    return this.ipcApi.invoke(CHANNELS.GET_PROFILE);
  }

  async updateMyProfile(request: UpdateAccountReq): Promise<AccountClientDTO> {
    return this.ipcApi.invoke(CHANNELS.UPDATE_PROFILE, request);
  }

  async checkAvailability(request: CheckAvailabilityReq): Promise<CheckAvailabilityRes> {
    return this.ipcApi.invoke(CHANNELS.CHECK_AVAILABILITY, request);
  }

  async closeAccount(request: CloseAccountReq): Promise<void> {
    await this.ipcApi.invoke(CHANNELS.CLOSE_ACCOUNT, request);
  }
}

export function createAccountIpcAdapter(ipcApi: IpcApi): IAccountApiClient {
  return new AccountIpcAdapter(ipcApi);
}

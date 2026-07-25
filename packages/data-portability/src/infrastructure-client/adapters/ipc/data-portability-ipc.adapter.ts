/**
 * Data Portability — IPC Adapter (renderer side)
 *
 * Implements IDataPortabilityApiClient via Electron IPC.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import { DataPortabilityChannels } from '@dailyuse/contracts/electron';
import type { IResultIpcClient, IDataPortabilityApiClient } from '../types';
import type {
  ExportServerHeldDataDisclosureReq,
  ExportServerHeldDataDisclosureRes,
  ExportUserDataReq,
  ExportUserDataRes,
  ImportUserDataReq,
  ImportUserDataRes,
} from '@dailyuse/contracts/data-portability';

export class DataPortabilityIpcAdapter implements IDataPortabilityApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async exportUserData(data: ExportUserDataReq): Promise<Result<ExportUserDataRes>> {
    return this.ipcClient.invoke(DataPortabilityChannels.EXPORT, data);
  }

  async exportServerHeldDataDisclosure(
    _data: ExportServerHeldDataDisclosureReq,
  ): Promise<Result<ExportServerHeldDataDisclosureRes>> {
    return fail({
      code: 'NOT_SUPPORTED',
      message: 'Server-held data disclosure is available from the authenticated Web runtime',
    });
  }

  async importUserData(data: ImportUserDataReq): Promise<Result<ImportUserDataRes>> {
    return this.ipcClient.invoke(DataPortabilityChannels.IMPORT, data);
  }
}

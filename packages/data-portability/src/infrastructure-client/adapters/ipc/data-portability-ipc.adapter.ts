/**
 * Data Portability — IPC Adapter (renderer side)
 *
 * Implements IDataPortabilityApiClient via Electron IPC.
 */

import type { Result } from '@dailyuse/contracts/result';
import { DataPortabilityChannels } from '@dailyuse/contracts/electron';
import type { IResultIpcClient, IDataPortabilityApiClient } from '../types';
import type { ExportUserDataReq, ExportUserDataRes, ImportUserDataReq, ImportUserDataRes } from '../../../contracts/portable-schema';

export class DataPortabilityIpcAdapter implements IDataPortabilityApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async exportUserData(data: ExportUserDataReq): Promise<Result<ExportUserDataRes>> {
    return this.ipcClient.invoke(DataPortabilityChannels.EXPORT, data);
  }

  async importUserData(data: ImportUserDataReq): Promise<Result<ImportUserDataRes>> {
    return this.ipcClient.invoke(DataPortabilityChannels.IMPORT, data);
  }
}

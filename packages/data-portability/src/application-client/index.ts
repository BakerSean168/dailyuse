/**
 * Data Portability Application Client Layer
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type { ExportUserDataReq, ExportUserDataRes, ImportUserDataReq, ImportUserDataRes } from '../contracts/portable-schema';
import type { IDataPortabilityApiClient } from '../infrastructure-client/adapters/types';
import { createDataPortabilityHttpAdapter } from '../infrastructure-client';

export type { IDataPortabilityApiClient } from '../infrastructure-client/adapters/types';

export interface DataPortabilityClientPort {
  exportUserData(data: ExportUserDataReq): Promise<Result<ExportUserDataRes>>;
  importUserData(data: ImportUserDataReq): Promise<Result<ImportUserDataRes>>;
}

export class DataPortabilityClientService implements DataPortabilityClientPort {
  constructor(private readonly apiClient: IDataPortabilityApiClient) {
    this.exportUserData = this.exportUserData.bind(this);
    this.importUserData = this.importUserData.bind(this);
  }

  exportUserData(data: ExportUserDataReq): Promise<Result<ExportUserDataRes>> {
    return this.apiClient.exportUserData(data);
  }

  importUserData(data: ImportUserDataReq): Promise<Result<ImportUserDataRes>> {
    return this.apiClient.importUserData(data);
  }
}

export function createDataPortabilityClientService(apiClient: IDataPortabilityApiClient): DataPortabilityClientService {
  return new DataPortabilityClientService(apiClient);
}

export function createDataPortabilityServiceFromHttpClient(httpClient: IResultHttpClient): DataPortabilityClientService {
  const adapter = createDataPortabilityHttpAdapter(httpClient);
  return createDataPortabilityClientService(adapter);
}

/**
 * Data Portability HTTP Adapter
 */

import type { Result } from '@memoflow/contracts/result';
import type { IResultHttpClient, IDataPortabilityApiClient } from '../types';
import type {
  ExportServerHeldDataDisclosureReq,
  ExportServerHeldDataDisclosureRes,
  ExportUserDataReq,
  ExportUserDataRes,
  ImportUserDataReq,
  ImportUserDataRes,
} from '@memoflow/contracts/data-portability';

export class DataPortabilityHttpAdapter implements IDataPortabilityApiClient {
  private readonly baseUrl = '/data-portability';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async exportUserData(data: ExportUserDataReq): Promise<Result<ExportUserDataRes>> {
    return this.httpClient.post(`${this.baseUrl}/export`, data);
  }

  async exportServerHeldDataDisclosure(
    data: ExportServerHeldDataDisclosureReq,
  ): Promise<Result<ExportServerHeldDataDisclosureRes>> {
    return this.httpClient.post(`${this.baseUrl}/server-held-data-disclosure`, data);
  }

  async importUserData(data: ImportUserDataReq): Promise<Result<ImportUserDataRes>> {
    return this.httpClient.post(`${this.baseUrl}/import`, data);
  }
}

export function createDataPortabilityHttpAdapter(
  httpClient: IResultHttpClient,
): DataPortabilityHttpAdapter {
  return new DataPortabilityHttpAdapter(httpClient);
}

/**
 * Data Portability Application Client Layer
 */

import type { Result } from '@memoflow/contracts/result';
import type { IResultHttpClient } from '@memoflow/http-client';
import type {
  ExportServerHeldDataDisclosureReq,
  ExportServerHeldDataDisclosureRes,
  ExportUserDataReq,
  ExportUserDataRes,
  ImportUserDataReq,
  ImportUserDataRes,
} from '@memoflow/contracts/data-portability';
import type { IDataPortabilityApiClient } from './ports/data-portability-api-client.port';
import { createDataPortabilityHttpAdapter } from '../infrastructure-client';

export type { IDataPortabilityApiClient } from './ports/data-portability-api-client.port';

/**
 * Application-facing client port.
 * Identical to IDataPortabilityApiClient for this module (no separate dual surface).
 */
export type DataPortabilityClientPort = IDataPortabilityApiClient;

export class DataPortabilityClientService implements IDataPortabilityApiClient {
  constructor(private readonly apiClient: IDataPortabilityApiClient) {
    this.exportUserData = this.exportUserData.bind(this);
    this.exportServerHeldDataDisclosure = this.exportServerHeldDataDisclosure.bind(this);
    this.importUserData = this.importUserData.bind(this);
  }

  exportUserData(data: ExportUserDataReq): Promise<Result<ExportUserDataRes>> {
    return this.apiClient.exportUserData(data);
  }

  exportServerHeldDataDisclosure(
    data: ExportServerHeldDataDisclosureReq,
  ): Promise<Result<ExportServerHeldDataDisclosureRes>> {
    return this.apiClient.exportServerHeldDataDisclosure(data);
  }

  importUserData(data: ImportUserDataReq): Promise<Result<ImportUserDataRes>> {
    return this.apiClient.importUserData(data);
  }
}

export function createDataPortabilityClientService(
  apiClient: IDataPortabilityApiClient,
): DataPortabilityClientService {
  return new DataPortabilityClientService(apiClient);
}

export function createDataPortabilityServiceFromHttpClient(
  httpClient: IResultHttpClient,
): DataPortabilityClientService {
  const adapter = createDataPortabilityHttpAdapter(httpClient);
  return createDataPortabilityClientService(adapter);
}

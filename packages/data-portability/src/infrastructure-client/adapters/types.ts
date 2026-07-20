/**
 * Data Portability Infrastructure Client — Port Interfaces
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  ExportServerHeldDataDisclosureReq,
  ExportServerHeldDataDisclosureRes,
  ExportUserDataReq,
  ExportUserDataRes,
  ImportUserDataReq,
  ImportUserDataRes,
} from '@dailyuse/contracts/data-portability';

export type { IResultHttpClient };

export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}

export interface IDataPortabilityApiClient {
  exportUserData(data: ExportUserDataReq): Promise<Result<ExportUserDataRes>>;
  exportServerHeldDataDisclosure(
    data: ExportServerHeldDataDisclosureReq,
  ): Promise<Result<ExportServerHeldDataDisclosureRes>>;
  importUserData(data: ImportUserDataReq): Promise<Result<ImportUserDataRes>>;
}

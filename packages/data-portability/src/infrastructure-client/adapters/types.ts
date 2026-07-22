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

/**
 * IPC Client interface (Result-returning).
 * Canonical definition in @dailyuse/ipc-client (ResultIpcClient).
 */
export type { IResultIpcClient } from '@dailyuse/ipc-client';

export interface IDataPortabilityApiClient {
  exportUserData(data: ExportUserDataReq): Promise<Result<ExportUserDataRes>>;
  exportServerHeldDataDisclosure(
    data: ExportServerHeldDataDisclosureReq,
  ): Promise<Result<ExportServerHeldDataDisclosureRes>>;
  importUserData(data: ImportUserDataReq): Promise<Result<ImportUserDataRes>>;
}

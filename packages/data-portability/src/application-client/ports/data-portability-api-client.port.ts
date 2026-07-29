/**
 * Data Portability API Client Port
 *
 * Transport-agnostic interface for export/import and server-held disclosure.
 * Implementations: HTTP adapters (web), IPC adapters (desktop).
 */

import type { Result } from '@memoflow/contracts/result';
import type {
  ExportServerHeldDataDisclosureReq,
  ExportServerHeldDataDisclosureRes,
  ExportUserDataReq,
  ExportUserDataRes,
  ImportUserDataReq,
  ImportUserDataRes,
} from '@memoflow/contracts/data-portability';

export interface IDataPortabilityApiClient {
  exportUserData(data: ExportUserDataReq): Promise<Result<ExportUserDataRes>>;
  exportServerHeldDataDisclosure(
    data: ExportServerHeldDataDisclosureReq,
  ): Promise<Result<ExportServerHeldDataDisclosureRes>>;
  importUserData(data: ImportUserDataReq): Promise<Result<ImportUserDataRes>>;
}

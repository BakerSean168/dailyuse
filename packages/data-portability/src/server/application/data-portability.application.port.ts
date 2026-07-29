import type {
  ExportUserDataReq,
  ExportUserDataRes,
  ImportUserDataReq,
  ImportUserDataRes,
} from '@memoflow/contracts/data-portability';

/**
 * Transport-neutral data portability application surface.
 */
export interface DataPortabilityApplicationPort {
  exportUserData(identityId: string, request: ExportUserDataReq): Promise<ExportUserDataRes>;
  importUserData(identityId: string, request: ImportUserDataReq): Promise<ImportUserDataRes>;
}

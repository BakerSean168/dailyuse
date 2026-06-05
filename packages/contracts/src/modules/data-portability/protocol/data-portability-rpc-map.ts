/**
 * Data Portability RPC Map — transport request/response pairs
 */

import { DataPortabilityChannels } from '../../../electron/ipc-channels';
import type { ExportUserDataReq, ExportUserDataRes } from '../api/export-user-data.dto';
import type { ImportUserDataReq, ImportUserDataRes } from '../api/import-user-data.dto';

export type DataPortabilityRpcMap = {
  [DataPortabilityChannels.EXPORT]: [ExportUserDataReq, ExportUserDataRes];
  [DataPortabilityChannels.IMPORT]: [ImportUserDataReq, ImportUserDataRes];
};

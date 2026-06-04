/**
 * Data Portability Transport Handlers
 *
 * Bridges the controller port to the use cases.
 */

import { ok } from '@dailyuse/contracts/result';
import type { ExportUserDataReq, ImportUserDataReq } from '../contracts/portable-schema';
import type { DataPortabilityUseCases } from './controller';
import type { ExportUserDataUseCase } from '../application-server/use-cases/export-user-data.use-case';
import type { ImportUserDataUseCase } from '../application-server/use-cases/import-user-data.use-case';

export function createDataPortabilityTransportHandlers(
  exportUseCase: ExportUserDataUseCase,
  importUseCase: ImportUserDataUseCase,
): DataPortabilityUseCases {
  return {
    exportUserData: async (data: ExportUserDataReq, ctx) =>
      ok(await exportUseCase.execute(ctx.identityId, data.include)),
    importUserData: async (data: ImportUserDataReq, ctx) =>
      ok(await importUseCase.execute(ctx.identityId, data.content, data.dryRun)),
  };
}

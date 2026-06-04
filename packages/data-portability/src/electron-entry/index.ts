/**
 * Data Portability — Electron Entry Point
 *
 * Registers IPC handlers for data export/import via PowerSync.
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { DataPortabilityChannels } from '@dailyuse/contracts/electron';
import { ResultCode, ResultErrorException } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils/logger';
import { formatZodErrors } from '@dailyuse/utils/result';
import {
  ExportUserDataReqSchema,
  ImportUserDataReqSchema,
  type ExportUserDataReq,
  type ImportUserDataReq,
} from '../contracts/portable-schema';
import { ExportUserDataUseCase } from '../application-server/use-cases/export-user-data.use-case';
import { ImportUserDataUseCase } from '../application-server/use-cases/import-user-data.use-case';
import { createPowerSyncDataPortabilityDependencies } from '../infrastructure-server/powersync/powersync-export-dependencies';
import { PowerSyncDataPortabilityImportStore } from '../infrastructure-server/powersync/powersync-import-store';
import { withAuthenticatedIdentity } from './authenticated-ipc';

const logger = createLogger('DataPortabilityElectron');

// Channel strings: 'data-portability:export', 'data-portability:import'
const channels = Object.values(DataPortabilityChannels);

function parseExportPayload(dto: unknown): ExportUserDataReq {
  const parsed = ExportUserDataReqSchema.safeParse(dto ?? {});
  if (!parsed.success) {
    throw new ResultErrorException(
      '参数验证失败',
      ResultCode.VALIDATION_ERROR,
      formatZodErrors(parsed.error.issues),
    );
  }
  return parsed.data;
}

function parseImportPayload(dto: unknown): ImportUserDataReq {
  const parsed = ImportUserDataReqSchema.safeParse(dto ?? {});
  if (!parsed.success) {
    throw new ResultErrorException(
      '参数验证失败',
      ResultCode.VALIDATION_ERROR,
      formatZodErrors(parsed.error.issues),
    );
  }
  return parsed.data;
}

export const DataPortabilityElectronModule: IElectronModule = {
  name: 'DataPortability',

  register(ctx: IElectronModuleContext): void {
    const deps = createPowerSyncDataPortabilityDependencies(ctx.db);
    const importStore = new PowerSyncDataPortabilityImportStore(ctx.db);
    const exportUseCase = new ExportUserDataUseCase(deps);
    const importUseCase = new ImportUserDataUseCase(importStore);

    ipcMain.handle(DataPortabilityChannels.EXPORT, (_, dto) => {
      return withAuthenticatedIdentity(ctx, (identityId) => {
        const payload = parseExportPayload(dto);
        return exportUseCase.execute(identityId, payload.include);
      });
    });

    ipcMain.handle(DataPortabilityChannels.IMPORT, (_, dto) => {
      return withAuthenticatedIdentity(ctx, (identityId) => {
        const payload = parseImportPayload(dto);
        return importUseCase.execute(identityId, payload.content, payload.dryRun ?? false);
      });
    });

    logger.info('DataPortability module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    logger.info('DataPortability module destroyed');
  },
};

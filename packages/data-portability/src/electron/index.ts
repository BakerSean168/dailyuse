/**
 * Data portability module Electron seam.
 *
 * Owns desktop-main registration for the data portability runtime.
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
} from '@dailyuse/contracts/data-portability';
import {
  createPowerSyncDataPortabilityModule,
  type DataPortabilityModuleInstance,
} from '../server/infrastructure/data-portability.module';
import { createDataPortabilityRuntimeContribution } from '../server/infrastructure/runtime';
import { withAuthenticatedIdentity } from './authenticated-ipc';

const logger = createLogger('DataPortabilityElectron');

const channels = Object.values(DataPortabilityChannels);
let activeDataPortabilityModule: DataPortabilityModuleInstance | null = null;

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
    const dataPortabilityModule = createPowerSyncDataPortabilityModule(ctx.db, {
      runtimeContributions: createDataPortabilityRuntimeContribution(),
    });
    activeDataPortabilityModule = dataPortabilityModule;
    dataPortabilityModule.start();

    ipcMain.handle(DataPortabilityChannels.EXPORT, (_, dto) => {
      return withAuthenticatedIdentity(ctx, (identityId) => {
        const payload = parseExportPayload(dto);
        return dataPortabilityModule.api.exportUserData(identityId, payload);
      });
    });

    ipcMain.handle(DataPortabilityChannels.IMPORT, (_, dto) => {
      return withAuthenticatedIdentity(ctx, (identityId) => {
        const payload = parseImportPayload(dto);
        return dataPortabilityModule.api.importUserData(identityId, payload);
      });
    });

    logger.info('DataPortability module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    activeDataPortabilityModule?.dispose();
    activeDataPortabilityModule = null;
    logger.info('DataPortability module destroyed');
  },
};

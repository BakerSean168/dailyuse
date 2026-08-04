import { ipcMain } from 'electron';
import {
  DashboardChannels,
  isElectronAuthResolutionError,
} from '@memoflow/contracts/electron';
import { extractStructuredResultError, fail, ok } from '@memoflow/contracts/result';
import { createLogger } from '@memoflow/utils/logger';
import type { IElectronAuthContext } from '@memoflow/contracts/electron';
import { getDesktopDashboardData } from '../services/dashboard-read-service';

const CHANNEL = DashboardChannels.GET_STATS;
const logger = createLogger('DashboardIpc');

export function registerDashboardIpcHandler(
  getAuthProvider: () => IElectronAuthContext | null,
): void {
  ipcMain.handle(CHANNEL, async () => {
    const auth = getAuthProvider();
    if (!auth) {
      return fail({ code: 'AUTH_REQUIRED', message: 'No active profile' });
    }

    try {
      const requestContext = await auth.requireRequestContext();
      const data = await getDesktopDashboardData(requestContext.identityId);
      return ok(data);
    } catch (error) {
      if (isElectronAuthResolutionError(error) && error.code === 'AUTH_RESTORING') {
        return fail({
          code: 'AUTH_RESTORING',
          message: 'Authentication restore in progress',
        });
      }

      if (isElectronAuthResolutionError(error) && error.code === 'AUTH_REQUIRED') {
        return fail({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        });
      }

      const structuredError = extractStructuredResultError(error);
      if (structuredError) {
        return fail({
          code: structuredError.code,
          message: structuredError.message,
          details: structuredError.details,
          context: structuredError.context,
          cause: structuredError.cause,
        });
      }

      logger.error('Failed to aggregate dashboard data', error);
      return fail({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard data',
      });
    }
  });
}

export function unregisterDashboardIpcHandler(): void {
  ipcMain.removeHandler(CHANNEL);
}

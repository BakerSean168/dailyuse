import { ipcMain } from 'electron';
import { fail, ok } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils';
import { DesktopAuthContextProvider } from '../auth/desktop-auth-context';
import { getDesktopDashboardData } from '../services/dashboard-read-service';

const CHANNEL = 'dashboard:get-stats';
const logger = createLogger('DashboardIpc');

export function registerDashboardIpcHandler(): void {
  ipcMain.handle(CHANNEL, async () => {
    const auth = new DesktopAuthContextProvider();

    try {
      const requestContext = await auth.requireRequestContext();
      const data = await getDesktopDashboardData(requestContext.identityId);
      return ok(data);
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_RESTORING') {
        return fail({
          code: 'AUTH_RESTORING',
          message: 'Authentication restore in progress',
        });
      }

      if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
        return fail({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
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

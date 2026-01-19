/**
 * Dashboard Application Service
 * @module application-client/dashboard
 */
import { GetDashboardData, RefreshDashboard, GetMetrics } from './services';

export class DashboardApplicationService {
  async getDashboardData(): Promise<any> {
    return GetDashboardData.getInstance().execute();
  }
  async refresh(): Promise<any> {
    return RefreshDashboard.getInstance().execute();
  }
  async getMetrics(): Promise<any> {
    return GetMetrics.getInstance().execute();
  }
}

export const dashboardApplicationService = new DashboardApplicationService();

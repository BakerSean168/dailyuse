import type { Result } from '@dailyuse/contracts/result';
import type { DashboardData } from '@dailyuse/contracts/dashboard';

// ── Port Interface ──
// Contract DTO types come from @dailyuse/contracts/dashboard (no dual re-export).

export interface IDashboardApiClient {
  getDashboardStats(): Promise<Result<DashboardData>>;
}

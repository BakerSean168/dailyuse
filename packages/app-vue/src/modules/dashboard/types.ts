import type { Result } from '@memoflow/contracts/result';
import type { DashboardData } from '@memoflow/contracts/dashboard';

// ── Port Interface ──
// Contract DTO types come from @memoflow/contracts/dashboard (no dual re-export).

export interface IDashboardApiClient {
  getDashboardStats(): Promise<Result<DashboardData>>;
}

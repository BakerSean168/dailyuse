/**
 * Governance CRUD Routes
 *
 * Placeholder routes for governance CRUD endpoints.
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { GovernanceModule } from '@dailyuse/governance';

export function registerGovernanceCrudRoutes(_governanceModule: GovernanceModule): Router {
  const router = ExpressRouter();

  return router;
}

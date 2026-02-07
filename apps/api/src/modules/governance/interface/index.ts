/**
 * Governance Routes Aggregator
 *
 * Aggregates all Governance HTTP routes.
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { GovernanceModule } from '@dailyuse/governance';
import { registerGovernanceCrudRoutes } from './governance-crud.routes';

export function registerGovernanceRoutes(governanceModule: GovernanceModule): Router {
  const router = ExpressRouter();

  router.use('/', registerGovernanceCrudRoutes(governanceModule));

  return router;
}

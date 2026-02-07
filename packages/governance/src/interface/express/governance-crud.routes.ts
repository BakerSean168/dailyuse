import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { GovernanceModule } from '../../module';

export type GovernanceCrudRoutesRegistrar = (governanceModule: GovernanceModule) => Router;

export const registerGovernanceCrudRoutes: GovernanceCrudRoutesRegistrar = (_governanceModule) => {
  const router = ExpressRouter();

  return router;
};

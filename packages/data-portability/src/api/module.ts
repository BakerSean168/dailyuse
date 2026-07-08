/**
 * Data Portability API Module Definition
 *
 * Composition root: creates repositories, use cases, handlers, and routes.
 */

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import { createLogger } from '@dailyuse/utils/logger';
import { registerDataPortabilityRoutes } from './routes';
import {
  createDataPortabilityPrismaModule,
  type DataPortabilityModuleInstance,
} from '../server/infrastructure';
import { createDataPortabilityRuntimeContribution } from '../server/infrastructure/runtime';

const logger = createLogger('DataPortabilityApi');
let activeDataPortabilityModule: DataPortabilityModuleInstance | null = null;

export type DataPortabilityApiModuleContext = ServerModuleContext<PrismaClient>;

export interface DataPortabilityApiModuleDef {
  readonly name: string;
  register(context: DataPortabilityApiModuleContext): void;
  destroy?(): void;
}

export const DataPortabilityApiModule: DataPortabilityApiModuleDef = {
  name: 'DataPortability',

  register(context) {
    const { router, middleware, db } = context;

    const dataPortabilityModule = createDataPortabilityPrismaModule(db, {
      runtimeContributions: createDataPortabilityRuntimeContribution(),
    });
    activeDataPortabilityModule = dataPortabilityModule;
    dataPortabilityModule.start();

    const routes = registerDataPortabilityRoutes(
      dataPortabilityModule.api,
      middleware,
      context.openApiRegistry,
    );
    router.use('/data-portability', routes);

    logger.info('DataPortability module registered');
  },

  destroy() {
    activeDataPortabilityModule?.dispose();
    activeDataPortabilityModule = null;
    logger.info('DataPortability module destroyed');
  },
};

/**
 * Account API Module Definition
 *
 * Implements IApiModule standard interface:
 * 1. Composition Root (PrismaAccountRepository → UseCases → Handlers)
 * 2. Route definition and mounting
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 */

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import {
  createAccountPrismaModule,
  type AccountModuleInstance,
} from '../server/infrastructure';
import { registerAccountRoutes } from './routes';

/**
 * Typed module context for account registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type AccountApiModuleContext = ServerModuleContext<PrismaClient>;

export interface AccountApiModuleDef {
  readonly name: string;
  register(context: AccountApiModuleContext): void;
  destroy?(): void;
}

let activeAccountModule: AccountModuleInstance | null = null;

export const AccountApiModule: AccountApiModuleDef = {
  name: 'Account',

  register(context) {
    const { router, middleware, db } = context;

    const accountModule = createAccountPrismaModule(db);
    activeAccountModule = accountModule;
    accountModule.start();

    const accountRoutes = registerAccountRoutes(
      accountModule.api,
      middleware,
      context.openApiRegistry,
    );

    router.use('/accounts', accountRoutes);
  },

  destroy() {
    activeAccountModule?.dispose();
    activeAccountModule = null;
  },
};

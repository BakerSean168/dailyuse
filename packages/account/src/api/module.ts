/**
 * Account API Module Definition
 *
 * Implements IApiModule standard interface:
 * 1. Composition Root (PrismaAccountRepository → UseCases → Handlers)
 * 2. Route definition and mounting
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 */

import type { PrismaClient } from '@memoflow/database';
import type { ServerModuleContext } from '@memoflow/contracts/shared';
// Structural cloud-auth shape (boundary: account must not depend on scope:authentication libs directly)
interface CloudAuthLike {
  revokeAllSessions(identityId: string): Promise<{ revokedSessions: number }>;
}
import {
  createAccountPrismaModule,
  type AccountModuleInstance,
  type CloudAuthRevocationPort,
  type AccountClosureEventPublisher,
} from '../server';
import { registerAccountRoutes } from './routes';

/**
 * Typed module context for account registration.
 * Extends shared ServerModuleContext with optional cloudAuth and ports.
 */
export type AccountApiModuleContext = ServerModuleContext<PrismaClient> & {
  readonly cloudAuth?: CloudAuthLike;
  readonly revocationPort?: CloudAuthRevocationPort;
  readonly eventPublisher?: AccountClosureEventPublisher;
};

export interface AccountApiModuleOptions {
  readonly cloudAuth?: CloudAuthLike;
  readonly revocationPort?: CloudAuthRevocationPort;
  readonly eventPublisher?: AccountClosureEventPublisher;
}

export interface AccountApiModuleDef {
  readonly name: string;
  register(context: AccountApiModuleContext): void;
  destroy?(): void;
}

let activeAccountModule: AccountModuleInstance | null = null;

export function createAccountApiModule(
  options: AccountApiModuleOptions = {},
): AccountApiModuleDef {
  return {
    name: 'Account',

    register(context) {
      const { router, middleware, db } = context;

      const accountModule = createAccountPrismaModule(db, {
        cloudAuth: options.cloudAuth ?? context.cloudAuth,
        revocationPort: options.revocationPort ?? context.revocationPort,
        eventPublisher: options.eventPublisher ?? context.eventPublisher,
      });
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
}

export const AccountApiModule: AccountApiModuleDef = createAccountApiModule();

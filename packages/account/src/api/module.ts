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
  PrismaAccountRepository,
  createAccountModule,
  type AccountModuleInstance,
} from '../infrastructure-server';
import { registerAccountRoutes } from './routes';
import { createAccountTransportHandlers } from './transport-handlers';
import { createAccountRuntimeContribution } from './runtime';
import { createAccountEventListenerRuntime } from '../application-server/handlers/register-account-event-listeners';

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

    // 1. Composition Root — 使用共享数据库单例
    const accountRepository = new PrismaAccountRepository(db);
    const accountModule = createAccountModule({
      accountRepository,
      runtimeContributions: createAccountRuntimeContribution(
        createAccountEventListenerRuntime(accountRepository),
      ),
    });
    activeAccountModule = accountModule;
    accountModule.start();

    // 2. 创建路由处理器
    const handlers = createAccountTransportHandlers(accountModule.api);

    // 3. 注册路由
    const accountRoutes = registerAccountRoutes(handlers, middleware, context.openApiRegistry);

    // 4. 挂载 API 路由
    router.use('/accounts', accountRoutes);
  },

  destroy() {
    activeAccountModule?.dispose();
    activeAccountModule = null;
  },
};

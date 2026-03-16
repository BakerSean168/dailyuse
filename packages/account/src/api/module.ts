/**
 * Account API Module Definition
 *
 * Implements IApiModule standard interface:
 * 1. Composition Root (PrismaAccountRepository → UseCases → Handlers)
 * 2. Route definition and mounting
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
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
 * Module context (structurally compatible with IApiModuleContext from apps/api).
 * Locally defined to avoid circular dependency on apps/api.
 */
export interface AccountApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
}

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
    const accountRepository = new PrismaAccountRepository(db as PrismaClient);
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

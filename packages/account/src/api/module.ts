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
import { ok } from '@dailyuse/contracts/result';
import { PrismaAccountRepository, AccountModule } from '../infrastructure-server';
import { AccountContainer } from '../infrastructure-server/di/account-container';
import { registerAccountRoutes } from './routes';
import type { AccountUseCases } from '../controllers/account.controller';
import { registerAccountInitializationTasks } from './initialization';

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

export const AccountApiModule: AccountApiModuleDef = {
  name: 'Account',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — 使用共享数据库单例
    const accountRepository = new PrismaAccountRepository(db as PrismaClient);
    const accountModule = new AccountModule({ accountRepository });

    // 1.5 设置 Container（供事件监听器使用）
    AccountContainer.getInstance().setAccountRepository(accountRepository);

    // 2. 创建路由处理器
    const handlers: AccountUseCases = {
      getProfile: async (ctx) =>
        ok((await accountModule.getProfile.execute(ctx.identityId)) as any),
      updateProfile: async (data, ctx) =>
        ok((await accountModule.updateProfile.execute(ctx.identityId, data)) as any),
      checkAvailability: async (data) =>
        ok((await accountModule.checkAvailability.execute(data)) as any),
      closeAccount: async (data, ctx) => {
        await accountModule.closeAccount.execute(ctx.identityId, data);
        return ok(undefined as any);
      },
    };

    // 3. 注册路由
    const accountRoutes = registerAccountRoutes(handlers, middleware, context.openApiRegistry);

    // 4. 挂载 API 路由
    router.use('/accounts', accountRoutes);

    // 5. 注册初始化任务（事件监听等）
    registerAccountInitializationTasks();
  },

  destroy() {
    AccountContainer.getInstance().reset();
  },
};

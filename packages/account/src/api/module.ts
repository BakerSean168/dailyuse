/**
 * Account API Module Definition
 *
 * Implements IApiModule standard interface:
 * 1. Composition Root (PrismaAccountRepository �?UseCases �?Handlers)
 * 2. Route definition and mounting
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 */

import { Router } from 'express';
import { prisma } from '@dailyuse/database';
import { PrismaAccountRepository } from '../infrastructure-server';
import {
  GetAccountProfileUseCase,
  UpdateAccountProfileUseCase,
  CloseAccountUseCase,
  CheckAvailabilityUseCase,
} from '../application-server';
import { registerAccountRoutes } from './routes';
import type { AccountRouteHandlers } from './routes';

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
}

export interface AccountApiModuleDef {
  readonly name: string;
  register(context: AccountApiModuleContext): void;
  destroy?(): void;
}

export const AccountApiModule: AccountApiModuleDef = {
  name: 'Account',

  register(context) {
    const { router, middleware } = context;

    // 1. Composition Root �?使用共享数据库单�?
    const accountRepository = new PrismaAccountRepository(prisma);

    const getProfile = new GetAccountProfileUseCase(accountRepository);
    const updateProfile = new UpdateAccountProfileUseCase(accountRepository);
    const closeAccount = new CloseAccountUseCase(accountRepository);
    const checkAvailability = new CheckAvailabilityUseCase(accountRepository);

    // 2. 创建路由处理�?
    const handlers: AccountRouteHandlers = {
      getProfile: (accountId) => getProfile.execute(accountId),
      updateProfile: (accountId, data) => updateProfile.execute(accountId, data),
      checkAvailability: (data) => checkAvailability.execute(data),
      closeAccount: (accountId, data) => closeAccount.execute(accountId, data),
    };

    // 3. 注册路由
    const accountRoutes = registerAccountRoutes(handlers, middleware);

    // 4. 挂载�?API 路由
    router.use('/accounts', accountRoutes);
  },
};

/**
 * API Bootstrapper
 *
 * 智能启动器 — 用链式 API 注册所有 IApiModule，
 * 统一管理全局中间件、路由挂载和错误处理的生命周期。
 *
 * @example
 * ```typescript
 * const app = await new ApiBootstrapper()
 *   .register(GovernanceApiModule)
 *   .register(LegacyAccountModule)
 *   .init();
 *
 * app.listen(3000);
 * ```
 */

import express, { type Express, Router } from 'express';
import type { IApiModule, IApiModuleContext, IApiMiddleware, DatabaseClient } from './shared/contracts/api-module';
import { applyGlobalMiddleware, applyErrorHandlers } from './shared/infrastructure/middleware';
import { authMiddleware, requireRole } from './shared/infrastructure/http/middlewares';
import { createRequireEmailVerifiedMiddleware } from '@dailyuse/authentication/api';
import { setupSwagger } from './shared/infrastructure/config/swagger';
import { createInfrastructureRouter } from './shared/infrastructure/http/routes/infrastructure-routes';
import { registry } from './shared/infrastructure/openapi/registry';
import { createLogger } from '@dailyuse/utils/logger';
import { MetricsStore } from './shared/infrastructure/http/middlewares/performance.middleware';

const logger = createLogger('Bootstrapper');

export class ApiBootstrapper {
  private readonly app: Express;
  private readonly rootRouter: Router;
  private readonly modules: IApiModule[] = [];
  private readonly db: DatabaseClient;
  private readonly metricsStore: MetricsStore;

  constructor(db: DatabaseClient) {
    this.app = express();
    this.rootRouter = Router();
    this.db = db;
    this.metricsStore = new MetricsStore();
  }

  /**
   * 链式注册模块
   */
  public register(module: IApiModule): this {
    this.modules.push(module);
    return this;
  }

  /**
   * 初始化并返回 Express 实例
   *
   * 执行顺序：
   * 1. 全局中间件（Helmet, CORS, Compression 等）
   * 2. Swagger 文档
   * 3. 基础设施路由（health, metrics 等）
   * 4. 模块注册（逐个调用 IApiModule.register）
   * 5. 挂载根路由到 /api 和 /api/v1
   * 6. 错误处理中间件
   */
  public async init(): Promise<Express> {
    // 1. 全局中间件
    applyGlobalMiddleware(this.app, this.metricsStore);

    // 2. Swagger
    setupSwagger(this.app);

    // 3. 基础设施路由（health, metrics 等 — 无版本前缀）
    this.app.use('/', createInfrastructureRouter(this.metricsStore));

    // 4. 准备模块上下文（含平台中间件 + 邮箱验证门禁）
    const requireEmailVerified = createRequireEmailVerifiedMiddleware({
      lookupStatus: async (identityId) => {
        const row = await this.db.authIdentity.findUnique({
          where: { id: identityId },
          select: { status: true },
        });
        return row?.status ?? null;
      },
    });
    const platformMiddleware: IApiMiddleware = {
      auth: authMiddleware,
      requireRole: (roles: string[]) => requireRole(roles),
      requireEmailVerified,
    };

    const context: IApiModuleContext = {
      app: this.app,
      router: this.rootRouter,
      db: this.db,
      middleware: platformMiddleware,
      openApiRegistry: registry,
    };

    logger.info('🚀 Starting Module Registration...');

    // 5. 逐个注册模块
    for (const mod of this.modules) {
      try {
        logger.info(`   ├─ 📦 Loading [${mod.name}]...`);
        await mod.register(context);
        logger.info(`   ├─ ✅ [${mod.name}] loaded`);
      } catch (err) {
        logger.error(`   ├─ ❌ [${mod.name}] failed to load`, err);
        throw err;
      }
    }

    logger.info(`   └─ 🎉 ${this.modules.length} module(s) registered`);

    // 6. 挂载根路由
    this.app.use('/api', this.rootRouter);
    this.app.use('/api/v1', this.rootRouter);

    // 7. 错误处理（必须最后）
    applyErrorHandlers(this.app);

    return this.app;
  }

  /**
   * 优雅关闭：调用所有已注册模块的 destroy() 方法
   */
  public async destroy(): Promise<void> {
    logger.info('Destroying modules...');

    for (const mod of this.modules) {
      if (mod.destroy) {
        try {
          await mod.destroy();
          logger.info(`   ├─ 🗑️ [${mod.name}] destroyed`);
        } catch (err) {
          logger.error(`   ├─ ❌ [${mod.name}] destroy failed`, err);
        }
      }
    }

    logger.info('All modules destroyed');
  }
}

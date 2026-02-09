/**
 * API Server Entry Point
 *
 * 使用 ApiBootstrapper 的白名单注册机制启动服务，
 * 每个模块实现 IApiModule 接口，自治管理依赖和路由。
 *
 * 模块注册策略：
 * - 新模块：直接实现 IApiModule（如 GovernanceApiModule）
 * - 旧模块：通过 legacy-adapters 适配（如 LegacyAccountModule）
 * - 故障模块：注释掉即可，不影响其他模块启动
 */

// 环境配置必须最先加载（包含 dotenv 加载逻辑）
import { env } from './shared/infrastructure/config/env.js';
import { connectPrisma, disconnectPrisma, prisma } from './shared/infrastructure/config/prisma';
import { initializeLogger, getStartupInfo } from './shared/infrastructure/config/logger.config';
import { createLogger } from '@dailyuse/utils';
import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { DataSourceManager } from '@dailyuse/infrastructure-server';
import { ApiBootstrapper } from './bootstrap';

// === 模块导入 ===
// 新模块（来自独立包，完全自治）
import { GovernanceApiModule } from '@dailyuse/governance/api';
// 旧模块适配器（临时胶水代码，待各模块重构后删除）
import { LegacyAccountModule, LegacyAuthenticationModule } from './legacy-adapters';

// 初始化日志系统
initializeLogger();
const logger = createLogger('API');

let bootstrapper: ApiBootstrapper | null = null;

async function bootstrap(): Promise<void> {
  logger.info('Starting DailyUse API server...', {
    ...getStartupInfo(),
    port: env.API_PORT,
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
  });

  // 1. 数据库连接
  try {
    await connectPrisma();
    logger.info('Database connected successfully');
  } catch (dbError) {
    logger.warn('Database connection failed, starting in limited mode', dbError);
  }

  // 2. DataSourceManager 初始化（兼容旧模块 DI）
  DataSourceManager.initialize({
    type: 'prisma',
    prismaClient: prisma,
  });

  // 3. 白名单注册 & 启动
  bootstrapper = new ApiBootstrapper(prisma);

  const app = await bootstrapper
    // === 核心：白名单注册 ===
    .register(GovernanceApiModule)         // ✅ 新模块（自治）
    .register(LegacyAccountModule)         // ✅ 旧模块适配
    .register(LegacyAuthenticationModule)  // ✅ 旧模块适配
    // .register(LegacyGoalModule)         // ❌ 暂不加载
    // .register(LegacyTaskModule)         // ❌ 暂不加载
    .init();

  // 4. 执行 InitializationManager 中的启动任务（各模块在 register 阶段注册的初始化任务）
  const initManager = InitializationManager.getInstance();
  await initManager.executePhase(InitializationPhase.APP_STARTUP);
  logger.info('✅ Initialization tasks executed');

  // 5. 启动监听
  app.listen(env.API_PORT, env.API_HOST, () => {
    logger.info(`✅ API server listening on http://${env.API_HOST}:${env.API_PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error('❌ Fatal Error during bootstrap:', err);
  process.exit(1);
});

// === 优雅关闭 ===
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  if (bootstrapper) {
    await bootstrapper.destroy();
  }

  await disconnectPrisma();
  logger.info('Database disconnected');

  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

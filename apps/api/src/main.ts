/**
 * API Server Entry Point
 *
 * 使用 ApiBootstrapper 的白名单注册机制启动服务，
 * 每个模块实现 IApiModule 接口，自治管理依赖和路由。
 *
 * 模块注册策略：
 * - 每个模块实现 IApiModule 接口（如 GovernanceApiModule）
 * - 模块内部自行管理数据库访问（通过 @dailyuse/database）
 * - 故障模块：注释掉即可，不影响其他模块启动
 */

// 环境配置必须最先加载（包含 dotenv 加载逻辑）
import { env } from './shared/infrastructure/config/env.js';
import { prisma, connectDatabase, disconnectDatabase } from '@dailyuse/database';
import { initializeLogger, getStartupInfo } from './shared/infrastructure/config/logger.config';
import { createLogger } from '@dailyuse/utils';
import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { ApiBootstrapper } from './bootstrap';

// === 模块导入 ===
// 新模块（来自独立包，完全自治）
import { GovernanceApiModule } from '@dailyuse/governance/api';
import { AccountApiModule } from '@dailyuse/account/api';
import { AuthenticationApiModule } from '@dailyuse/authentication/api';
import { GoalApiModule } from '@dailyuse/goal/api';
import { TaskApiModule } from '@dailyuse/task/api';

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
    await connectDatabase();
    logger.info('Database connected successfully');
  } catch (dbError) {
    logger.warn('Database connection failed, starting in limited mode', dbError);
  }

  // 2. 白名单注册 & 启动
  bootstrapper = new ApiBootstrapper(prisma);

  const app = await bootstrapper
    // === 核心：白名单注册 ===
    .register(GovernanceApiModule)         // ✅ 治理模块
    .register(AccountApiModule)            // ✅ 账户模块
    .register(AuthenticationApiModule)     // ✅ 认证模块
    .register(TaskApiModule)              // ✅ 任务模块
    .register(GoalApiModule)              // ✅ 目标模块
    // .register(LegacyGoalModule)         // ❌ 暂不加载
    // .register(LegacyTaskModule)         // ❌ 暂不加载
    .init();

  // 3. 执行 InitializationManager 中的启动任务（各模块在 register 阶段注册的初始化任务）
  const initManager = InitializationManager.getInstance();
  await initManager.executePhase(InitializationPhase.APP_STARTUP);
  logger.info('✅ Initialization tasks executed');

  // 4. 启动监听
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

  await disconnectDatabase();
  logger.info('Database disconnected');

  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

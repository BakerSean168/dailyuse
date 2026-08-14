/**
 * API Server Entry Point
 *
 * 使用 ApiBootstrapper 的白名单注册机制启动服务，
 * 每个模块实现 IApiModule 接口。
 *
 * 模块注册策略：
 * - 每个模块实现 IApiModule 接口
 * - 宿主（本文件 runtime 层）负责 feature 装配：治理的 adapter/application
 *   组装由 apps/api/src/runtime/compose-governance.ts 完成（选择 Prisma repository
 *   → event-log runtime → createGovernanceModule），模块只注册 transport 与生命周期
 * - 故障模块：注释掉即可，不影响其他模块启动
 */

// 环境配置必须最先加载（包含 dotenv 加载逻辑）
import {
  env,
  getJwtConfig,
  getGithubOAuthConfig,
  getGithubAppConfig,
} from './shared/infrastructure/config/env.js';
import { prisma, connectDatabase, disconnectDatabase } from '@memoflow/database';
import { initializeLogger, getStartupInfo } from './shared/infrastructure/config/logger.config';
import { createLogger } from '@memoflow/utils/logger';
import { createRuntimeOwnership } from '@memoflow/contracts/primitives';
import { ApiBootstrapper } from './bootstrap';
import { ensurePowerSyncPublication } from './shared/infrastructure/database/ensure-powersync-publication.js';

// === 模块导入 ===
// 新模块（来自独立包，完全自治）
import { composeGovernance } from './runtime/compose-governance';
import { composeAccount } from './runtime/compose-account';
import { composeNotification } from './runtime/compose-notification';
import { composeReminder } from './runtime/compose-reminder';
import { composeRepository } from './runtime/compose-repository';
import { composeSchedule } from './runtime/compose-schedule';
import { composeSetting } from './runtime/compose-setting';
import { composeDataPortability } from './runtime/compose-data-portability';
import { composeAI } from './runtime/compose-ai';
import {
  AccountClosedWorker,
  PrismaAccountClosureOperationRepository,
  createCloudAccountProvisioner,
} from '@memoflow/account';
import { ReminderAccountClosedConsumer } from '@memoflow/reminder/server';
import { NotificationAccountClosedConsumer } from '@memoflow/notification/server';
import { RepositoryAccountClosedConsumer } from '@memoflow/repository/server';
import {
  createCloudAuth,
  createCloudAuthEmailDelivery,
  createCloudAuthEmailLinkCapture,
} from '@memoflow/cloud-auth/server';
import { composeGoal } from './runtime/compose-goal';
import { PrismaTaskBindingReadPort } from '@memoflow/task';
import { createGoalTaskProgressPrismaHandler } from '@memoflow/goal';
import { createGoalPrismaScheduleExecutionSource } from '@memoflow/goal/schedule-execution';
import { createGoalPrismaScheduleProjectionSource } from '@memoflow/goal/schedule-projection';
import { resolveRepositoryStorageBaseDir } from '@memoflow/repository';
import { createSchedulePrismaRepositories } from '@memoflow/schedule';
import { createScheduleOrchestrationModule } from '@memoflow/schedule-orchestration';
import { createTaskPrismaScheduleExecutionSource } from '@memoflow/task/schedule-execution';
import { createTaskPrismaScheduleProjectionSource } from '@memoflow/task/schedule-projection';
import { composeTask } from './runtime/compose-task';
// 基础设施模块（直接在 API 内部定义）
import { PowerSyncApiModule } from './modules/powersync/module.js';
import { DashboardApiModule } from './modules/dashboard/module.js';
import { RepositoryKnowledgeCloudDataPurgerAdapter } from './modules/ai/repository-knowledge-cloud-data-purger.adapter';
import { createCronScheduler } from './shared/infrastructure/cron/index.js';
import type { CronSchedulerManager } from './shared/infrastructure/cron/index.js';
import { PrismaOutboxWriter } from './outbox/prisma-outbox-writer';

// 初始化日志系统
initializeLogger();
const logger = createLogger('API');

let bootstrapper: ApiBootstrapper | null = null;
let scheduler: CronSchedulerManager | null = null;
const repositoryStorageBaseDir = resolveRepositoryStorageBaseDir();

async function bootstrap(): Promise<void> {
  // R0-1：runtime ownership —— 明确"哪个宿主在运行、当前进程是谁"，
  // 为双宿主对账与 R3 的 scheduler 单宿主租约打底。
  const ownership = createRuntimeOwnership('cloud-api', undefined, () => new Date());
  logger.info('[runtime-ownership] API host ownership', {
    ...ownership,
    nodeEnv: env.NODE_ENV,
    port: env.API_PORT,
  });

  logger.info('Starting MemoFlow API server...', {
    ...getStartupInfo(),
    port: env.API_PORT,
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
  });

  // 1. 数据库连接
  let databaseConnected = false;
  try {
    await connectDatabase();
    databaseConnected = true;
    logger.info('Database connected successfully');
  } catch (dbError) {
    logger.warn('Database connection failed, starting in limited mode', dbError);
  }

  if (databaseConnected) {
    logger.info('Ensuring PowerSync publication exists');
    await ensurePowerSyncPublication();
  }

  const jwtConfig = getJwtConfig();
  const githubOAuthConfig = getGithubOAuthConfig();
  const baseEmailDelivery = createCloudAuthEmailDelivery();
  const testEmailLinks = env.LOCAL_VALIDATION
    ? createCloudAuthEmailLinkCapture(baseEmailDelivery)
    : undefined;
  const closureRepo = new PrismaAccountClosureOperationRepository(prisma);
  const accountActiveChecker = async (identityId: string) =>
    (await closureRepo.findActiveByIdentityId(identityId)) !== null;
  const cloudAuth = createCloudAuth({
    database: prisma,
    secret: jwtConfig.secret,
    baseUrl:
      env.AUTH_BASE_URL ??
      `http://${env.API_HOST === '0.0.0.0' ? 'localhost' : env.API_HOST}:${env.API_PORT}/api/auth`,
    deviceVerificationUrl: new URL(
      '/auth/device',
      env.MEMOFLOW_WEB_URL ?? 'http://localhost:5173',
    ).toString(),
    trustedOrigins: env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    github: githubOAuthConfig ?? undefined,
    userProvisioner: createCloudAccountProvisioner(prisma),
    emailDelivery: testEmailLinks?.delivery ?? baseEmailDelivery,
    closureChecker: accountActiveChecker,
  });

  // 2. 白名单注册 & 启动
  bootstrapper = new ApiBootstrapper(prisma, cloudAuth, testEmailLinks);

  // Step C：宿主 runtime 负责 feature 装配。所有 remaining 模块（account /
  // notification / reminder / repository / schedule / setting / data-portability）
  // 都通过 runtime composer 组装成已绑定实例的 module handle，再按原注册顺序注册。
  const accountApiModule = composeAccount({
    db: prisma,
    cloudAuth,
  });
  const notificationApiModule = composeNotification({
    db: prisma,
    closureChecker: accountActiveChecker,
    channelCapabilities: [
      {
        channelType: 'InApp',
        status: 'available',
        requiredInProduction: true,
      },
    ],
  });
  const reminderApiModule = composeReminder({
    db: prisma,
    closureChecker: accountActiveChecker,
  });
  const repositoryApiModule = composeRepository({
    db: prisma,
    storageBaseDir: repositoryStorageBaseDir,
    closureChecker: accountActiveChecker,
    githubApp: getGithubAppConfig() ?? undefined,
    knowledgeRepositoryCloudDataPurger: new RepositoryKnowledgeCloudDataPurgerAdapter(prisma),
  });
  const settingApiModule = composeSetting({ db: prisma });
  const dataPortabilityApiModule = composeDataPortability({ db: prisma });

  // Schedule 两阶段装配：先创建一次 schedule 仓储集合，把其中的
  // scheduleTaskRepository 交给 schedule orchestration（产出 sourceExecutor），
  // 再把同一集合与 sourceExecutor 交给 composeSchedule —— 全程只有一个集合。
  // 事件总线失败时兜底到 durable outbox（R1-2 merge-base 行为）。
  const scheduleRepositorySet = createSchedulePrismaRepositories(prisma, {
    outboxWriter: new PrismaOutboxWriter(prisma),
  });
  const scheduleOrchestrationModule = createScheduleOrchestrationModule({
    taskProjection: {
      source: createTaskPrismaScheduleProjectionSource(prisma),
      scheduleTaskRepository: scheduleRepositorySet.scheduleTaskRepository,
    },
    goalProjection: {
      source: createGoalPrismaScheduleProjectionSource(prisma),
      scheduleTaskRepository: scheduleRepositorySet.scheduleTaskRepository,
    },
    reminderProjection: {
      source: reminderApiModule.scheduleProjectionSource,
      scheduleTaskRepository: scheduleRepositorySet.scheduleTaskRepository,
    },
    execution: {
      taskSource: createTaskPrismaScheduleExecutionSource(prisma),
      goalSource: createGoalPrismaScheduleExecutionSource(prisma),
      reminderSource: reminderApiModule.scheduleExecutionSource,
      notificationPort: notificationApiModule.scheduleNotificationPort,
    },
  });
  const scheduleApiModule = composeSchedule({
    repositories: scheduleRepositorySet,
    sourceExecutor: scheduleOrchestrationModule.sourceExecutor,
  });
  const taskApiModule = composeTask({
    db: prisma,
    runtimeContributions: scheduleOrchestrationModule.projectionRuntime,
    goalProgressHandler: createGoalTaskProgressPrismaHandler(prisma),
  });
  const aiApiModule = composeAI({
    db: prisma,
    repositoryApiPort: repositoryApiModule.getApplicationPort(),
    repositoryStorageBaseDir,
  });
  const governanceApiModule = composeGovernance({ db: prisma });
  const goalApiModule = composeGoal({
    db: prisma,
    taskBindingReadPort: new PrismaTaskBindingReadPort(prisma),
  });
  const app = await bootstrapper
    // === 核心：白名单注册 ===
    .register(governanceApiModule) // ✅ 治理模块 (runtime composer)
    .register(accountApiModule) // ✅ 账户模块 (runtime composer)
    .register(notificationApiModule.module) // ✅ 通知模块 (runtime composer)
    .register(reminderApiModule.module) // ✅ 提醒模块 (runtime composer)
    .register(repositoryApiModule) // ✅ 仓库模块 (runtime composer)
    .register(scheduleApiModule.module) // ✅ 日程模块 (runtime composer)
    .register(settingApiModule) // ✅ 设置模块 (runtime composer)
    .register(taskApiModule) // ✅ 任务模块
    .register(aiApiModule) // ✅ AI 模块 (runtime composer)
    .register(goalApiModule) // ✅ 目标模块
    .register(dataPortabilityApiModule.module) // ✅ 数据导入导出模块 (runtime composer)
    .register(PowerSyncApiModule) // ✅ PowerSync 同步模块
    .register(DashboardApiModule) // ✅ 仪表盘聚合模块
    .init();

  // 3. 启动监听
  app.listen(env.API_PORT, env.API_HOST, () => {
    logger.info(`✅ API server listening on http://${env.API_HOST}:${env.API_PORT}`);
  });

  // 5. 注册并启动 Cron Jobs
  scheduler = createCronScheduler({
    cleanupExpiredDeviceCodes: () => cloudAuth.cleanupExpiredDeviceCodes(),
    processAccountClosedOutbox: () =>
      new AccountClosedWorker(prisma, {
        reminderConsumer: new ReminderAccountClosedConsumer(prisma),
        notificationConsumer: new NotificationAccountClosedConsumer(prisma),
        repositoryConsumer: new RepositoryAccountClosedConsumer(prisma),
      }).processPendingMessages(),
  });
  scheduler.start();
}

bootstrap().catch((err) => {
  logger.error('❌ Fatal Error during bootstrap:', err);
  process.exit(1);
});

// === 优雅关闭 ===
async function gracefulShutdown(signal: string, exitCode = 0): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  scheduler?.stop();

  if (bootstrapper) {
    await bootstrapper.destroy();
  }

  await disconnectDatabase();
  logger.info('Database disconnected');

  process.exit(exitCode);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// === 进程级异常兜底 ===
// 防止未处理的 Promise 拒绝直接终止 API 进程（Node 22 默认行为），
// 与 Electron main 的 runtime-init 保持一致的可观测性。
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection in API process', reason);
});

// 未捕获异常后进程状态不可信（资源泄漏、全局状态半更新、不变量被破坏），
// 记录后走优雅关闭并以非零码退出，交由 supervisor / 编排层重启，
// 而不是带着损坏状态继续服务请求。
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception in API process, shutting down', error);
  void gracefulShutdown('uncaughtException', 1).catch(() => process.exit(1));
});

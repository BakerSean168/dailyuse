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
import { env, getJwtConfig, getGithubOAuthConfig } from './shared/infrastructure/config/env.js';
import { prisma, connectDatabase, disconnectDatabase } from '@dailyuse/database';
import { initializeLogger, getStartupInfo } from './shared/infrastructure/config/logger.config';
import { createLogger } from '@dailyuse/utils/logger';
import { ApiBootstrapper } from './bootstrap';
import { ensurePowerSyncPublication } from './shared/infrastructure/database/ensure-powersync-publication.js';

// === 模块导入 ===
// 新模块（来自独立包，完全自治）
import { GovernanceApiModule } from '@dailyuse/governance/api';
import { AccountApiModule } from '@dailyuse/account/api';
import { createAuthenticationApiModule } from '@dailyuse/authentication/api';
import { createEditorApiModule } from '@dailyuse/editor/api';
import { GoalApiModule } from '@dailyuse/goal/api';
import { createGoalPrismaScheduleExecutionSource } from '@dailyuse/goal/schedule-execution';
import { createGoalPrismaScheduleProjectionSource } from '@dailyuse/goal/schedule-projection';
import { NotificationApiModule } from '@dailyuse/notification/api';
import { createNotificationPrismaScheduleNotificationPort } from '@dailyuse/notification/schedule-execution';
import { ReminderApiModule } from '@dailyuse/reminder/api';
import { createReminderPrismaScheduleExecutionSource } from '@dailyuse/reminder/schedule-execution';
import { createReminderPrismaScheduleProjectionSource } from '@dailyuse/reminder/schedule-projection';
import { createRepositoryApiModule } from '@dailyuse/repository/api';
import { resolveRepositoryStorageBaseDir } from '@dailyuse/repository';
import { createScheduleTaskPrismaRepository } from '@dailyuse/schedule';
import { createScheduleApiModule } from '@dailyuse/schedule/api';
import { createScheduleOrchestrationModule } from '@dailyuse/schedule-orchestration';
import { createSettingPrismaModule } from '@dailyuse/setting';
import { SettingApiModule } from '@dailyuse/setting/api';
import { DataPortabilityApiModule } from '@dailyuse/data-portability/api';
import { createTaskPrismaScheduleExecutionSource } from '@dailyuse/task/schedule-execution';
import { createTaskPrismaScheduleProjectionSource } from '@dailyuse/task/schedule-projection';
import {
  createAIApiModule,
  type AIApiModuleContext,
} from '@dailyuse/ai/api';
import { createTaskApiModule } from '@dailyuse/task/api';
// 基础设施模块（直接在 API 内部定义）
import { PowerSyncApiModule } from './modules/powersync/module.js';
import { DashboardApiModule } from './modules/dashboard/module.js';
import { ControlledAnalyticsReadAdapter } from './modules/ai/controlled-analytics-read.adapter';
import { BackendAutomationToolExecutorAdapter } from './modules/ai/backend-automation-tool-executor.adapter';
import { RepositoryKnowledgeNotePersistenceAdapter } from './modules/ai/repository-knowledge-note-persistence.adapter';
import { RepositoryKnowledgeSourceAdapter } from './modules/ai/repository-knowledge-source.adapter';
import {
  createCronScheduler,
} from './shared/infrastructure/cron/index.js';
import type { CronSchedulerManager } from './shared/infrastructure/cron/index.js';

// 初始化日志系统
initializeLogger();
const logger = createLogger('API');

let bootstrapper: ApiBootstrapper | null = null;
let scheduler: CronSchedulerManager | null = null;
const repositoryStorageBaseDir = resolveRepositoryStorageBaseDir();

const AIApiModule = createAIApiModule({
  createKnowledgeNotePersistence: (context: AIApiModuleContext) =>
    new RepositoryKnowledgeNotePersistenceAdapter(
      context.db,
      repositoryStorageBaseDir,
    ),
  createKnowledgeSourcePort: (context: AIApiModuleContext) =>
    new RepositoryKnowledgeSourceAdapter(
      context.db,
      repositoryStorageBaseDir,
    ),
  createAnalyticsReadPort: (context: AIApiModuleContext) =>
    new ControlledAnalyticsReadAdapter(context.db),
  createAutomationToolExecutor: (context: AIApiModuleContext) =>
    new BackendAutomationToolExecutorAdapter(
      context.db,
      repositoryStorageBaseDir,
    ),
  getKnowledgeNoteSubpath: async (identityId: string, context: AIApiModuleContext) => {
    const settingModule = createSettingPrismaModule(context.db);
    const setting = await settingModule.api.getUserSetting(identityId);
    return setting.preferences.ai.knowledgeNoteSubpath;
  },
});

async function bootstrap(): Promise<void> {
  logger.info('Starting Memoflow API server...', {
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

  // 2. 白名单注册 & 启动
  bootstrapper = new ApiBootstrapper(prisma);
  const scheduleTaskRepository = createScheduleTaskPrismaRepository(prisma);
  const scheduleOrchestrationModule = createScheduleOrchestrationModule({
    taskProjection: {
      source: createTaskPrismaScheduleProjectionSource(prisma),
      scheduleTaskRepository,
    },
    goalProjection: {
      source: createGoalPrismaScheduleProjectionSource(prisma),
      scheduleTaskRepository,
    },
    reminderProjection: {
      source: createReminderPrismaScheduleProjectionSource(prisma),
      scheduleTaskRepository,
    },
    execution: {
      taskSource: createTaskPrismaScheduleExecutionSource(prisma),
      goalSource: createGoalPrismaScheduleExecutionSource(prisma),
      reminderSource: createReminderPrismaScheduleExecutionSource(prisma),
      notificationPort: createNotificationPrismaScheduleNotificationPort(prisma),
    },
  });
  const taskApiModule = createTaskApiModule({
    runtimeContributions: scheduleOrchestrationModule.projectionRuntime,
  });
  const scheduleApiModule = createScheduleApiModule({
    sourceExecutor: scheduleOrchestrationModule.sourceExecutor,
  });
  const repositoryApiModule = createRepositoryApiModule({
    storageBaseDir: repositoryStorageBaseDir,
  });
  const editorApiModule = createEditorApiModule({
    repositoryStorageBaseDir,
  });

  // Authentication secrets come from the validated env schema (JWT_SECRET min 32
  // chars, REFRESH_TOKEN_SECRET defaults to JWT_SECRET), injected here so the
  // module never reads process.env directly or bypasses schema validation.
  const jwtConfig = getJwtConfig();
  // GitHub login is optional and pluggable: only registered when configured.
  // GitHub 登录可选且可插拔：仅在配置齐全时注册。
  const githubOAuthConfig = getGithubOAuthConfig();
  const authenticationApiModule = createAuthenticationApiModule({
    jwtSecret: jwtConfig.secret,
    refreshSecret: jwtConfig.refreshSecret,
    github: githubOAuthConfig ?? undefined,
  });

  const app = await bootstrapper
    // === 核心：白名单注册 ===
    .register(GovernanceApiModule) // ✅ 治理模块
    .register(AccountApiModule) // ✅ 账户模块
    .register(authenticationApiModule) // ✅ 认证模块
    .register(editorApiModule) // ✅ 编辑器模块
    .register(NotificationApiModule) // ✅ 通知模块
    .register(ReminderApiModule) // ✅ 提醒模块
    .register(repositoryApiModule) // ✅ 仓库模块
    .register(scheduleApiModule) // ✅ 日程模块
    .register(SettingApiModule) // ✅ 设置模块
    .register(taskApiModule) // ✅ 任务模块
    .register(AIApiModule) // ✅ AI 模块
    .register(GoalApiModule) // ✅ 目标模块
    .register(DataPortabilityApiModule) // ✅ 数据导入导出模块
    .register(PowerSyncApiModule) // ✅ PowerSync 同步模块
    .register(DashboardApiModule) // ✅ 仪表盘聚合模块
    .init();

  // 3. 启动监听
  app.listen(env.API_PORT, env.API_HOST, () => {
    logger.info(`✅ API server listening on http://${env.API_HOST}:${env.API_PORT}`);
  });

  // 5. 注册并启动 Cron Jobs
  scheduler = createCronScheduler();
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

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
import { createLogger } from '@dailyuse/utils/logger';
import { ApiBootstrapper } from './bootstrap';
import { ensurePowerSyncPublication } from './shared/infrastructure/database/ensure-powersync-publication.js';

// === 模块导入 ===
// 新模块（来自独立包，完全自治）
import { GovernanceApiModule } from '@dailyuse/governance/api';
import { AccountApiModule } from '@dailyuse/account/api';
import { AuthenticationApiModule } from '@dailyuse/authentication/api';
import { EditorApiModule } from '@dailyuse/editor/api';
import { GoalApiModule } from '@dailyuse/goal/api';
import { GoalPrismaRepository } from '@dailyuse/goal/infrastructure-server';
import { NotificationApiModule } from '@dailyuse/notification/api';
import {
  NotificationPreferencePrismaRepository,
  NotificationPrismaRepository,
  NotificationTemplatePrismaRepository,
} from '@dailyuse/notification/infrastructure-server';
import { CreateNotificationUseCase } from '@dailyuse/notification/application-server';
import { ReminderApiModule } from '@dailyuse/reminder/api';
import { ReminderTemplatePrismaRepository } from '@dailyuse/reminder/infrastructure-server';
import { RepositoryApiModule } from '@dailyuse/repository/api';
import { createScheduleApiModule } from '@dailyuse/schedule/api';
import { createSharedSourceExecutor } from '@dailyuse/schedule/application-server';
import { SettingApiModule } from '@dailyuse/setting/api';
import { TaskApiModule } from '@dailyuse/task/api';
import {
  TaskInstancePrismaRepository,
  TaskTemplatePrismaRepository,
} from '@dailyuse/task/infrastructure-server';
import { createAIApiModule } from '@dailyuse/ai';
import type { AIApiModuleContext } from '@dailyuse/ai/api';
import { createSettingModule, UserSettingPrismaRepository } from '@dailyuse/setting';
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

const AIApiModule = createAIApiModule({
  createKnowledgeNotePersistence: (context: AIApiModuleContext) =>
    new RepositoryKnowledgeNotePersistenceAdapter(
      context.db as typeof prisma,
      process.env.REPOSITORY_STORAGE_PATH || '/tmp/dailyuse-repository-storage',
    ),
  createKnowledgeSourcePort: (context: AIApiModuleContext) =>
    new RepositoryKnowledgeSourceAdapter(
      context.db as typeof prisma,
      process.env.REPOSITORY_STORAGE_PATH || '/tmp/dailyuse-repository-storage',
    ),
  createAnalyticsReadPort: (context: AIApiModuleContext) =>
    new ControlledAnalyticsReadAdapter(context.db as typeof prisma),
  createAutomationToolExecutor: (context: AIApiModuleContext) =>
    new BackendAutomationToolExecutorAdapter(
      context.db as typeof prisma,
      process.env.REPOSITORY_STORAGE_PATH || '/tmp/dailyuse-repository-storage',
    ),
  getKnowledgeNoteSubpath: async (identityId: string, context: AIApiModuleContext) => {
    const settingModule = createSettingModule({
      userSettingRepository: new UserSettingPrismaRepository(context.db as typeof prisma),
    });
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
  const scheduleApiModule = createScheduleApiModule({
    sourceExecutor: createSharedSourceExecutor({
      reminderRepository: new ReminderTemplatePrismaRepository(prisma),
      goalRepository: new GoalPrismaRepository(prisma),
      taskInstanceRepository: new TaskInstancePrismaRepository(prisma),
      taskTemplateRepository: new TaskTemplatePrismaRepository(prisma),
      createNotification: new CreateNotificationUseCase(
        new NotificationPrismaRepository(prisma),
        new NotificationTemplatePrismaRepository(prisma),
        new NotificationPreferencePrismaRepository(prisma),
      ),
    }),
  });

  const app = await bootstrapper
    // === 核心：白名单注册 ===
    .register(GovernanceApiModule) // ✅ 治理模块
    .register(AccountApiModule) // ✅ 账户模块
    .register(AuthenticationApiModule) // ✅ 认证模块
    .register(EditorApiModule) // ✅ 编辑器模块
    .register(NotificationApiModule) // ✅ 通知模块
    .register(ReminderApiModule) // ✅ 提醒模块
    .register(RepositoryApiModule) // ✅ 仓库模块
    .register(scheduleApiModule) // ✅ 日程模块
    .register(SettingApiModule) // ✅ 设置模块
    .register(TaskApiModule) // ✅ 任务模块
    .register(AIApiModule) // ✅ AI 模块
    .register(GoalApiModule) // ✅ 目标模块
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
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  scheduler?.stop();

  if (bootstrapper) {
    await bootstrapper.destroy();
  }

  await disconnectDatabase();
  logger.info('Database disconnected');

  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

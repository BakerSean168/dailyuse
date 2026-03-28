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
import { EditorApiModule } from '@dailyuse/editor/api';
import { GoalApiModule } from '@dailyuse/goal/api';
import { GoalPrismaRepository } from '@dailyuse/goal/infrastructure-server';
import { NotificationApiModule } from '@dailyuse/notification/api';
import {
  NotificationPreferencePrismaRepository,
  NotificationPrismaRepository,
  NotificationTemplatePrismaRepository,
} from '@dailyuse/notification/infrastructure-server';
import { CreateNotification } from '@dailyuse/notification/application-server';
import { ReminderApiModule } from '@dailyuse/reminder/api';
import { ReminderTemplatePrismaRepository } from '@dailyuse/reminder/infrastructure-server';
import { RepositoryApiModule } from '@dailyuse/repository/api';
import { createScheduleApiModule } from '@dailyuse/schedule/api';
import { SettingApiModule } from '@dailyuse/setting/api';
import { TaskApiModule } from '@dailyuse/task/api';
import { TaskInstancePrismaRepository, TaskTemplatePrismaRepository } from '@dailyuse/task/infrastructure-server';
import { createAIApiModule } from '@dailyuse/ai';
import type { AIApiModuleContext } from '@dailyuse/ai/api';
import { createSettingModule, UserSettingPrismaRepository } from '@dailyuse/setting';
import {
  NotificationCategory,
  NotificationChannelType,
  NotificationType,
  RelatedEntityType,
} from '@dailyuse/contracts/notification';
import { NotificationChannel as ReminderNotificationChannel } from '@dailyuse/contracts/reminder';
import { SourceModule } from '@dailyuse/contracts/schedule';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';
// 基础设施模块（直接在 API 内部定义）
import { PowerSyncApiModule } from './modules/powersync/module.js';
import { DashboardApiModule } from './modules/dashboard/module.js';
import { ControlledAnalyticsReadAdapter } from './modules/ai/controlled-analytics-read.adapter';
import { BackendAutomationToolExecutorAdapter } from './modules/ai/backend-automation-tool-executor.adapter';
import { RepositoryKnowledgeNotePersistenceAdapter } from './modules/ai/repository-knowledge-note-persistence.adapter';
import { RepositoryKnowledgeSourceAdapter } from './modules/ai/repository-knowledge-source.adapter';

// 初始化日志系统
initializeLogger();
const logger = createLogger('API');

let bootstrapper: ApiBootstrapper | null = null;

function mapReminderChannels(channels: readonly string[]): NotificationChannelType[] {
  const resolved = new Set<NotificationChannelType>();

  if (channels.length === 0) {
    resolved.add(NotificationChannelType.InApp);
    resolved.add(NotificationChannelType.Push);
    return [...resolved];
  }

  for (const channel of channels) {
    if (channel === ReminderNotificationChannel.InApp) {
      resolved.add(NotificationChannelType.InApp);
    }
    if (channel === ReminderNotificationChannel.Push) {
      resolved.add(NotificationChannelType.Push);
    }
  }

  if (resolved.size === 0) {
    resolved.add(NotificationChannelType.InApp);
    resolved.add(NotificationChannelType.Push);
  }

  return [...resolved];
}

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
  const scheduleApiModule = createScheduleApiModule({
    sourceExecutor: {
      async execute(task) {
        const createNotification = new CreateNotification(
          new NotificationPrismaRepository(prisma),
          new NotificationTemplatePrismaRepository(prisma),
          new NotificationPreferencePrismaRepository(prisma),
        );

        if (task.sourceModule === SourceModule.Reminder) {
          const reminderTemplateRepository = new ReminderTemplatePrismaRepository(prisma);
          const reminder = await reminderTemplateRepository.findById(task.sourceEntityId, {
            includeHistory: true,
          });
          if (!reminder || !reminder.isEffectivelyEnabled() || reminder.deletedAt) {
            return { nextRunAt: null, result: { skipped: true } };
          }

          reminder.recordTrigger();
          await reminderTemplateRepository.save(reminder);

          await createNotification.execute({
            identityId: String(reminder.identityId),
            title: reminder.notificationConfig.title ?? reminder.title,
            content: reminder.notificationConfig.body ?? reminder.description ?? '',
            type: NotificationType.Reminder,
            category: NotificationCategory.Reminder,
            relatedEntityType: RelatedEntityType.Reminder,
            relatedEntityId: reminder.id,
            channels: mapReminderChannels(reminder.notificationConfig.channels),
          });

          return {
            nextRunAt: reminder.nextTriggerAt,
            result: {
              reminderId: reminder.id,
              reminderTitle: reminder.title,
            },
          };
        }

        if (task.sourceModule === SourceModule.Goal) {
          const goalRepository = new GoalPrismaRepository(prisma);
          const goal = await goalRepository.findById(task.sourceEntityId, { includeChildren: true });
          if (
            !goal ||
            goal.deletedAt ||
            goal.archivedAt ||
            goal.completedAt ||
            goal.status !== 'Active' ||
            !goal.reminderConfig?.enabled
          ) {
            return { nextRunAt: null, result: { skipped: true } };
          }

          const triggerType =
            typeof task.metadata.payload['triggerType'] === 'string'
              ? task.metadata.payload['triggerType']
              : undefined;
          const triggerValue =
            typeof task.metadata.payload['triggerValue'] === 'number'
              ? task.metadata.payload['triggerValue']
              : undefined;
          const content =
            triggerType === 'RemainingDays' && triggerValue !== undefined
              ? `目标「${goal.name}」距离截止还有 ${triggerValue} 天。`
              : triggerType === 'TimeProgressPercentage' && triggerValue !== undefined
                ? `目标「${goal.name}」已达到 ${triggerValue}% 时间进度节点。`
                : goal.description ?? `目标「${goal.name}」已到达提醒时间。`;

          await createNotification.execute({
            identityId: String(goal.identityId),
            title: `目标提醒：${goal.name}`,
            content,
            type: NotificationType.Reminder,
            category: NotificationCategory.Goal,
            relatedEntityType: RelatedEntityType.Goal,
            relatedEntityId: goal.id,
            channels: [NotificationChannelType.InApp, NotificationChannelType.Push],
          });

          return {
            nextRunAt: null,
            result: {
              goalId: goal.id,
              goalTitle: goal.name,
              triggerType,
              triggerValue,
            },
          };
        }

        if (task.sourceModule === SourceModule.Task) {
          const taskInstanceRepository = new TaskInstancePrismaRepository(prisma);
          const taskTemplateRepository = new TaskTemplatePrismaRepository(prisma);
          const instance = await taskInstanceRepository.findById(task.sourceEntityId);

          if (
            !instance ||
            instance.deletedAt ||
            (instance.status !== TaskInstanceStatus.Pending &&
              instance.status !== TaskInstanceStatus.InProgress)
          ) {
            return { nextRunAt: null, result: { skipped: true } };
          }

          const template = await taskTemplateRepository.findById(String(instance.templateId));
          const taskTitle =
            typeof task.metadata.payload['taskTitle'] === 'string'
              ? task.metadata.payload['taskTitle']
              : template?.title ?? '未命名任务';
          const reminderType =
            typeof task.metadata.payload['reminderType'] === 'string'
              ? task.metadata.payload['reminderType']
              : undefined;
          const reminderValue =
            typeof task.metadata.payload['reminderValue'] === 'number'
              ? task.metadata.payload['reminderValue']
              : undefined;
          const reminderUnit =
            typeof task.metadata.payload['reminderUnit'] === 'string'
              ? task.metadata.payload['reminderUnit']
              : undefined;
          const content =
            reminderType === 'Relative' && reminderValue !== undefined && reminderUnit
              ? `任务「${taskTitle}」的提前 ${reminderValue}${reminderUnit} 提醒已到达。`
              : `任务「${taskTitle}」已到达提醒时间。`;

          await createNotification.execute({
            identityId: String(instance.identityId),
            title: `任务提醒：${taskTitle}`,
            content,
            type: NotificationType.Reminder,
            category: NotificationCategory.Task,
            relatedEntityType: RelatedEntityType.Task,
            relatedEntityId: instance.id,
            channels: [NotificationChannelType.InApp, NotificationChannelType.Push],
          });

          return {
            nextRunAt: null,
            result: {
              instanceId: instance.id,
              templateId: String(instance.templateId),
              taskTitle,
              reminderType,
              reminderValue,
              reminderUnit,
            },
          };
        }

        throw new Error(`Unsupported schedule source module: ${task.sourceModule}`);
      },
    },
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

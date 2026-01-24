// 环境配置必须最先加载（包含 dotenv 加载逻辑）
import { env, isDevelopment, isProduction } from './shared/infrastructure/config/env.js';

import { createApp } from './app';
import { connectPrisma, disconnectPrisma, prisma } from './shared/infrastructure/config/prisma';
import { initializeApp } from './shared/initialization/initializer';
import { eventBus } from '@dailyuse/utils';
import { initializeLogger, getStartupInfo } from './shared/infrastructure/config/logger.config';
import { createLogger } from '@dailyuse/utils';
import { registerAllCronJobs, startCronScheduler, stopCronScheduler } from './shared/infrastructure/cron';
import { registerTaskEventListeners } from '@dailyuse/application-server/task';
import { 
  GoalModule, 
  AccountModule, 
  TaskModule, 
  ScheduleModule, 
  ReminderModule, 
  NotificationModule, 
  SettingModule, 
  AIModule 
} from '@dailyuse/infrastructure-server';
import { DataSourceManager } from '@dailyuse/infrastructure-server';

// 初始化日志系统
initializeLogger();
const logger = createLogger('API');

(async () => {
  try {
    logger.info('Starting DailyUse API server...', {
      ...getStartupInfo(),
      port: env.API_PORT,
      nodeEnv: env.NODE_ENV,
      logLevel: env.LOG_LEVEL,
    });

    // Try to connect to database
    try {
      await connectPrisma();
      logger.info('Database connected successfully');

      await initializeApp();
      logger.info('Application initialized successfully');
    } catch (dbError) {
      logger.warn('Database connection failed, starting in limited mode', dbError);
      logger.warn('Performance metrics endpoint will still be available');
    }

    // 🎯 初始化 Infrastructure Module (Composition Root)
    // 关键: 使用 DataSourceManager 确保 TaskModule 能获取正确的数据库实例
    DataSourceManager.initialize({
      type: 'prisma',
      prismaClient: prisma,
    });

    const goalModule = new GoalModule(prisma);
    const accountModule = new AccountModule(prisma);
    const taskModule = new TaskModule('prisma', prisma);
    const scheduleModule = new ScheduleModule(prisma);
    const reminderModule = new ReminderModule(prisma);
    const notificationModule = new NotificationModule(prisma);
    const settingModule = new SettingModule(prisma);
    const aiModule = new AIModule(prisma);
    
    // 注册 Task 事件监听器
    registerTaskEventListeners(taskModule.taskInstanceRepository);
    logger.info('✅ Task event listeners registered successfully');

    /* 
    logger.warn(
      '⚠️ Schedule module is temporarily disabled - needs refactoring for new cron-based schema',
    );
    */

    // 启动统一 Cron 调度器
    registerAllCronJobs();
    startCronScheduler();
    logger.info('✅ Unified cron scheduler started', {
      description: 'Handles all cron jobs including Focus Mode, Reminder Triggers, and Daily Analysis',
    });

    // 🏭 创建 App 并注入依赖
    const app = createApp({
      goalModule: goalModule,
      accountModule: accountModule,
      taskModule: taskModule,
      scheduleModule: scheduleModule,
      reminderModule: reminderModule,
      notificationModule: notificationModule,
      settingModule: settingModule,
      aiModule: aiModule,
    });

    app.listen(env.API_PORT, env.API_HOST, () => {
      logger.info(`API server listening on http://${env.API_HOST}:${env.API_PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal, shutting down gracefully...');
  stopCronScheduler();
  await disconnectPrisma();
  logger.info('Database disconnected');
  process.exit(0);
});
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal, shutting down gracefully...');
  stopCronScheduler();
  await disconnectPrisma();
  logger.info('Database disconnected');
  process.exit(0);
});

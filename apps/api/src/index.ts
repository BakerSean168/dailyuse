// 环境配置必须最先加载（包含 dotenv 加载逻辑）
import { env, isDevelopment, isProduction } from './shared/infrastructure/config/env.js';

import app from './app';
import { connectPrisma, disconnectPrisma, prisma } from './shared/infrastructure/config/prisma';
import { initializeApp } from './shared/initialization/initializer';
// import { ScheduleTaskScheduler } from './modules/schedule/infrastructure/scheduler/ScheduleTaskScheduler'; // DISABLED: Schedule module needs refactoring
// import { PriorityQueueScheduler } from './modules/schedule/infrastructure/scheduler/PriorityQueueScheduler'; // DISABLED: Schedule module needs refactoring
// import { sseController } from './modules/schedule/interface/http/SSEController'; // DISABLED: Schedule module needs refactoring
import { eventBus } from '@dailyuse/utils';
import { initializeLogger, getStartupInfo } from './shared/infrastructure/config/logger.config';
import { createLogger } from '@dailyuse/utils';
// DISABLED: Cron jobs moved to unified cron scheduler in shared/infrastructure/cron
// import {
//   startFocusModeCronJob,
//   stopFocusModeCronJob,
// } from './modules/goal/infrastructure/cron/focusModeCronJob';
// import {
//   startReminderTriggerCronJob,
//   stopReminderTriggerCronJob,
// } from './modules/reminder/infrastructure/cron/reminderTriggerCronJob';
import { registerAllCronJobs, startCronScheduler, stopCronScheduler } from './shared/infrastructure/cron';
import { registerTaskEventListeners } from '@dailyuse/application-server/task';

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

    // Try to connect to database, but don't fail if it's unavailable
    try {
      await connectPrisma();
      logger.info('Database connected successfully');

      await initializeApp();
      logger.info('Application initialized successfully');
    } catch (dbError) {
      logger.warn('Database connection failed, starting in limited mode', dbError);
      logger.warn('Performance metrics endpoint will still be available');
    }

    // 🎯 注册事件处理器（事件驱动架构）
    // registerEventHandlers(prisma, sseController); // DISABLED: Schedule module needs refactoring
    // logger.info('Event handlers registered successfully');
    
    // 注册 Task 事件监听器
    registerTaskEventListeners();
    logger.info('✅ Task event listeners registered successfully');

    // 启动调度器（优先队列 vs 轮询）
    // DISABLED: Schedule module needs complete refactoring for new cron-based schema
    // if (USE_PRIORITY_QUEUE_SCHEDULER) {
    //   const scheduler = PriorityQueueScheduler.getInstance(prisma, eventBus);
    //   await scheduler.start();
    //   logger.info('✅ 优先队列调度器已启动', {
    //     type: 'PriorityQueue',
    //     mechanism: 'setTimeout',
    //     precision: '<100ms',
    //     status: scheduler.getStatus(),
    //   });
    // } else {
    //   const scheduler = ScheduleTaskScheduler.getInstance(prisma, eventBus);
    //   scheduler.start();
    //   logger.info('⚠️  传统轮询调度器已启动（不推荐）', {
    //     type: 'Polling',
    //     mechanism: 'cron',
    //     precision: '0-60s',
    //   });
    // }
    logger.warn(
      '⚠️ Schedule module is temporarily disabled - needs refactoring for new cron-based schema',
    );

    // 启动统一 Cron 调度器 (Smart Frequency 等)
    // 包括: DailyAnalysisCronJob, FocusMode, ReminderTrigger 等
    registerAllCronJobs();
    startCronScheduler();
    logger.info('✅ Unified cron scheduler started', {
      description: 'Handles all cron jobs including Focus Mode, Reminder Triggers, and Daily Analysis',
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

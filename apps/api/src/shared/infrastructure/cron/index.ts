/**
 * Cron Infrastructure Module
 * 
 * 提供统一的 Cron Job 调度管理功能
 * 
 * 使用方式:
 * 1. 在应用启动时调用 registerAllCronJobs() 注册所有 Jobs
 * 2. 调用 startCronScheduler() 启动调度器
 * 3. 在应用关闭时调用 stopCronScheduler() 停止调度器
 */

export { CronSchedulerManager } from './cron-scheduler-manager';
export type { CronJobConfig } from './cron-scheduler-manager';
export { registerAllCronJobs, startCronScheduler, stopCronScheduler } from './register-cron-jobs';

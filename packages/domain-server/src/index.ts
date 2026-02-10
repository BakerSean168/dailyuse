/**
 * Domain Server 模块导出
 * 
 * 注意：goal, task, repository, editor, reminder, notification, schedule, setting
 * 已提取为独立包，这里通过 re-export 保持向后兼容。
 */

// Account 模块
export * from './account/index.js';

// Authentication 模块
export * from './authentication/index.js';

// Repository 模块
export * from '@dailyuse/repository/domain-server';

// Task 模块
export * from '@dailyuse/task/domain-server';

// Setting 模块
export * from '@dailyuse/setting/domain-server';

// Goal 模块
export * from '@dailyuse/goal/domain-server';

// Reminder 模块
export * from '@dailyuse/reminder/domain-server';

// Notification 模块
export * from '@dailyuse/notification/domain-server';

// Editor 模块
export * from '@dailyuse/editor/domain-server';

// Schedule 模块
export * from '@dailyuse/schedule/domain-server';

// AI 模块
export * from './ai/index.js';

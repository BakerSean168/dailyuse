// Shared utilities and cross-module types
export * from './shared';

// 暂时 identity id 统一从 account 包导出，虽然 authentication 也需要使用

export * from './account';
export * from './authentication';

// AI 模块
export * from './ai';

// Editor 模块export * from '@dailyuse/editor/domain-shared';
// Goal 模块export * from '@dailyuse/goal/domain-shared';
// Notification 模块export * from '@dailyuse/notification/domain-shared';
// Reminder 模块export * from '@dailyuse/reminder/domain-shared';
// Repository 模块export * from '@dailyuse/repository/domain-shared';
// Schedule 模块export * from '@dailyuse/schedule/domain-shared';
// Setting 模块export * from '@dailyuse/setting/domain-shared';
// Sync 模块
export * from './sync';

// Task 模块export * from '@dailyuse/task/domain-shared';
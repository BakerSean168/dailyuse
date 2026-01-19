/**
 * Account Web Module
 * 账户 Web 模块导出
 */

// 应用层服务
export * from './application/services';

// 基础设施层 API 客户端
export * from './infrastructure/api';

// 展示层
export { useAccountStore } from './presentation/stores/accountStore';
export { useAccountProfile, useAccountSubscription } from './presentation/composables';

// 初始化
export { registerAccountInitializationTasks } from './initialization/accountInitialization';

// 事件处理器
export { AccountEventHandlers } from './application/events/accountEventHandlers';

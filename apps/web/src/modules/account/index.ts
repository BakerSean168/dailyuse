/**
 * Account Web Module
 * 账户 Web 模块导出
 */

// 展示层 - Store
export { useAccountStore } from './presentation/stores/accountStore';
export type { AccountState } from './presentation/stores/accountStore';

// 展示层 - Composables
export { useAccount } from './presentation/composables';

// 初始化
export { registerAccountInitializationTasks } from './initialization/accountInitialization';


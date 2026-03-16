/**
 * Reminder Application Module (Client)
 * 提醒模块客户端应用层
 *
 * Constructor-injected application service for reminder management.
 * 使用构造函数注入的提醒管理客户端服务。
 *
 * Uses Result<T> pattern for consistent error handling.
 * 使用 Result<T> 模式实现一致的错误处理。
 */

// ===== Port Interfaces / 端口接口 =====
export type { IReminderApiClient } from '../infrastructure-client/adapters/types';

// ===== Client Service / 客户端服务 =====
export { ReminderClientService } from './reminder-client-service';

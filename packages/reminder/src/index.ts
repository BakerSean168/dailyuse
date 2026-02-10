/**
 * @dailyuse/reminder
 *
 * 提醒模块 - 提醒模板、组与调度
 *
 * 【分层架构】
 *
 * contracts           → 类型定义、DTO、事件、API Schema（@dailyuse/contracts/reminder）
 * domain-shared       → 值对象（前后端共享）
 * domain-server       → 聚合根、仓储接口、领域服务
 * domain-client       → 客户端领域模型
 * application-server  → 用例服务（服务端）
 * application-client  → 客户端服务
 * infrastructure-server → Prisma/SQLite 仓储实现、DI 模块
 * infrastructure-client → HTTP/IPC 适配器
 *
 * 【使用示例】
 *
 * ```typescript
 * // 1. 导入契约
 * import type { ReminderTemplateServerDTO } from '@dailyuse/contracts/reminder';
 *
 * // 2. 导入服务端聚合根
 * import { ReminderTemplate } from '@dailyuse/reminder/domain-server';
 *
 * // 3. 导入基础设施模块
 * import { ReminderModule } from '@dailyuse/reminder/infrastructure-server';
 * ```
 */

// ================= Contracts Layer =================
export * from '@dailyuse/contracts/reminder';

// ================= Domain Layer =================
export * from './domain-server';

// ================= Application Layer =================
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer =================
export * from './infrastructure-server';
export * from './infrastructure-client';

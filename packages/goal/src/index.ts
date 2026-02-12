/**
 * @dailyuse/goal
 *
 * 目标模块 - OKR 目标与关键结果管理
 *
 * 【分层架构】
 *
 * contracts           → 类型定义、DTO、事件、API Schema（@dailyuse/contracts/goal）
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
 * import type { GoalServerDTO } from '@dailyuse/contracts/goal';
 *
 * // 2. 导入服务端聚合根
 * import { Goal, GoalFolder } from '@dailyuse/goal/domain-server';
 *
 * // 3. 导入基础设施模块
 * import { GoalModule } from '@dailyuse/goal/infrastructure-server';
 * ```
 */

// ================= Contracts Layer =================
export * from '@dailyuse/contracts/goal';

// ================= Domain Layer =================
export * from './domain-server';

// ================= Application Layer =================
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer =================
export * from './infrastructure-server';
export * from './infrastructure-client';

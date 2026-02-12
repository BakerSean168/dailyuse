/**
 * @dailyuse/schedule
 *
 * 调度模块 - 日程与时间管理
 *
 * 【分层架构】
 *
 * contracts           → 类型定义、DTO、事件、API Schema（@dailyuse/contracts/schedule）
 * domain-shared       → 值对象（前后端共享）
 * domain-server       → 聚合根、仓储接口、领域服务、计算器
 * domain-client       → 客户端领域模型
 * application-server  → 用例服务（服务端）、调度器
 * application-client  → 客户端服务
 * infrastructure-server → Prisma/SQLite 仓储实现、DI 模块、调度引导
 * infrastructure-client → HTTP/IPC 适配器
 *
 * 【使用示例】
 *
 * ```typescript
 * // 1. 导入契约
 * import type { ScheduleServerDTO } from '@dailyuse/contracts/schedule';
 *
 * // 2. 导入服务端聚合根
 * import { Schedule, ScheduleTask } from '@dailyuse/schedule/domain-server';
 *
 * // 3. 导入基础设施模块
 * import { ScheduleModule } from '@dailyuse/schedule/infrastructure-server';
 * ```
 */

// ================= Contracts Layer =================
export * from '@dailyuse/contracts/schedule';

// ================= Domain Layer =================
export * from './domain-server';

// ================= Application Layer =================
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer =================
export * from './infrastructure-server';
export * from './infrastructure-client';

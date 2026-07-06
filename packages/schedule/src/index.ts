/**
 * @dailyuse/schedule
 *
 * 调度模块 - 日程与时间管理
 * Schedule Module - Calendar & Time Management
 *
 * 【分层架构 / Layered Architecture】
 *
 * contracts           → 类型定义、DTO、事件、API Schema（@dailyuse/contracts/schedule）
 *                       Type definitions, DTOs, events, API schemas
 * domain-shared       → 值对象（前后端共享）
 *                       Value objects (shared front/back)
 * domain-server       → 聚合根、仓储接口、领域服务、计算器
 *                       Aggregates, repository interfaces, domain services
 * domain-client       → 客户端领域模型
 *                       Client-side domain models
 * application-server  → 用例服务（服务端）、调度器
 *                       Use cases (server), scheduler
 * application-client  → 客户端服务
 *                       Client services
 * infrastructure-server → Prisma/PowerSync 仓储实现、组合根、运行时装配
 *                         Prisma/PowerSync repos, composition root, runtime assembly
 * infrastructure-client → HTTP/IPC 适配器
 *                         HTTP/IPC adapters
 *
 * 【使用示例 / Usage】
 *
 * ```typescript
 * // 1. 导入契约 / Import contracts
 * import type { ScheduleServerDTO } from '@dailyuse/contracts/schedule';
 *
 * // 2. 导入公共聚合根 / Import public aggregates
 * import { CalendarEntry, ScheduleTask } from '@dailyuse/schedule';
 * import { ScheduleConfig } from '@dailyuse/schedule/domain-shared';
 *
 * // 3. 使用稳定 API seam / Use the stable API seam
 * import { createScheduleApiModule } from '@dailyuse/schedule/api';
 * bootstrapper.register(createScheduleApiModule({ sourceExecutor }));
 * ```
 */

// ================= Domain Layer =================
export * from './domain-server';

export * from './application-client';

// ================= Infrastructure Layer =================
// removed re-export of './infrastructure-server' to avoid exposing concrete adapters; import specific subpaths instead

export * from './infrastructure-client';

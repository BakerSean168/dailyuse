/**
 * @dailyuse/reminder
 *
 * 提醒模块 - 提醒模板、组与调度
 * Reminder module - reminder templates, groups, and scheduling
 *
 * 【分层架构 / Layered Architecture】
 *
 * contracts           → 类型定义、DTO、事件、API Schema（@dailyuse/contracts/reminder）
 *                       Type definitions, DTOs, events, API schemas
 * domain-shared       → 值对象（前后端共享）
 *                       Value objects (shared between client and server)
 * domain-server       → 聚合根、仓储接口、领域服务
 *                       Aggregate roots, repository interfaces, domain services
 * domain-client       → 客户端领域模型
 *                       Client-side domain models
 * application-server  → 用例服务（服务端）
 *                       Use case services (server-side)
 * application-client  → 客户端服务
 *                       Client-side services
 * infrastructure-server → 组合根、Prisma/PowerSync 仓储实现
 *                         Composition root, Prisma/PowerSync repository implementations
 * infrastructure-client → HTTP/IPC 适配器
 *                         HTTP/IPC adapters
 *
 * 【使用示例 / Usage Examples】
 *
 * ```typescript
 * // 1. Import contracts / 导入契约
 * import type { ReminderTemplateServerDTO } from '@dailyuse/contracts/reminder';
 *
 * // 2. Import server aggregates / 导入服务端聚合根
 * import { ReminderTemplate } from '@dailyuse/reminder/domain-server';
 *
 * // 3. Import composition root / 导入组合根
 * import { createReminderModule } from '@dailyuse/reminder/infrastructure-server';
 * ```
 */

// ================= Contracts Layer =================

// ================= Domain Layer =================
export * from './domain-server';

// ================= Application Layer =================
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer =================
export * from './infrastructure-server';
export * from './infrastructure-client';

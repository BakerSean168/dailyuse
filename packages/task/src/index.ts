/**
 * @dailyuse/task
 *
 * 任务模块 - 任务模板、实例与依赖管理
 * Task module — task templates, instances, and dependency management.
 *
 * 【分层架构 / Layered Architecture】
 *
 * contracts           → 类型定义、DTO、事件、API Schema（@dailyuse/contracts/task）
 *                       Type definitions, DTOs, events, API schemas
 * domain-shared       → 值对象（前后端共享）
 *                       Value objects (shared between client and server)
 * domain-server       → 聚合根、仓储接口、领域服务
 *                       Aggregates, repository interfaces, domain services
 * domain-client       → 客户端领域模型
 *                       Client-side domain models
 * application-server  → 用例服务（服务端）
 *                       Use case services (server-side)
 * application-client  → 客户端服务
 *                       Client-side services
 * infrastructure-server → Prisma/SQLite 仓储实现、组合根工厂
 *                         Repository implementations, composition root factories
 * infrastructure-client → HTTP/IPC 适配器
 *                         HTTP/IPC adapters
 *
 * 【使用示例 / Usage Examples】
 *
 * ```typescript
 * // 1. 导入契约 / Import contracts
 * import type { TaskTemplateServerDTO } from '@dailyuse/contracts/task';
 *
 * // 2. 导入服务端聚合根 / Import server aggregates
 * import { TaskTemplate, TaskInstance } from '@dailyuse/task/domain-server';
 *
 * // 3. 使用组合根 / Use composition root
 * import { createTaskModule } from '@dailyuse/task/infrastructure-server';
 * const module = createTaskModule({
 *   taskTemplateRepository,
 *   taskInstanceRepository,
 *   taskDependencyRepository,
 * });
 * const result = await module.api.createTaskTemplate.execute(dto);
 * ```
 */

// ================= Domain Layer =================
export * from './domain-server';

// ================= Application Layer =================
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer =================
// Composition root + types — concrete adapters imported via subpath:
//   @dailyuse/task/infrastructure-server
export {
  createTaskModule,
  createTaskPowerSyncModule,
  type TaskApplicationPort,
  type TaskModuleDependencies,
  type TaskModuleInstance,
  type TaskModuleRuntimeContribution,
  type TaskModuleUseCases,
} from './infrastructure-server';

export * from './infrastructure-client';

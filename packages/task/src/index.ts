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
export {
  /** @internal Concrete Prisma implementation — use ITaskTemplateRepository interface instead. Prisma 具体实现 — 请使用 ITaskTemplateRepository 接口。 */
  TaskTemplatePrismaRepository,
  /** @internal Concrete Prisma implementation — use ITaskInstanceRepository interface instead. Prisma 具体实现 — 请使用 ITaskInstanceRepository 接口。 */
  TaskInstancePrismaRepository,
  /** @internal Concrete Prisma implementation — use ITaskDependencyRepository interface instead. Prisma 具体实现 — 请使用 ITaskDependencyRepository 接口。 */
  TaskDependencyPrismaRepository,
  /** @internal Concrete Prisma implementation — use ITaskFolderRepository interface instead. Prisma 具体实现 — 请使用 ITaskFolderRepository 接口。 */
  TaskFolderPrismaRepository,
  /** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
  PowerSyncTaskTemplateRepository,
  /** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
  PowerSyncTaskInstanceRepository,
  /** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
  PowerSyncTaskDependencyRepository,
  /** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
  PowerSyncTaskFolderRepository,
  createTaskModule,
  createTaskPowerSyncModule,
  type TaskApplicationPort,
  type TaskModuleDependencies,
  type TaskModuleInstance,
  type TaskModuleRuntimeContribution,
  type TaskModuleUseCases,
} from './infrastructure-server';

export * from './infrastructure-client';

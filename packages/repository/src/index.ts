/**
 * @dailyuse/repository
 *
 * 仓库模块 - 文件/资源仓库管理
 *
 * 【分层架构】
 *
 * contracts           → 类型定义、DTO、事件、API Schema（@dailyuse/contracts/repository）
 * domain-shared       → 值对象（前后端共享）
 * domain-server       → 聚合根、仓储接口、领域服务
 * domain-client       → 客户端领域模型
 * application-server  → 用例服务（服务端）
 * application-client  → 客户端服务
 * infrastructure-server → Prisma/PowerSync/Memory 仓储实现、DI 模块
 * infrastructure-client → HTTP/IPC 适配器
 *
 * 【使用示例】
 *
 * ```typescript
 * // 1. 导入契约
 * import type { RepositoryServerDTO } from '@dailyuse/contracts/repository';
 *
 * // 2. 导入公共聚合根与组合根
 * import {
 *   Repository,
 *   createRepositoryModule,
 *   type RepositoryModuleInstance,
 * } from '@dailyuse/repository';
 *
 * // 3. 导入组合根（推荐）
 * ```
 */

// ================= Contracts Layer =================

// ================= Domain Layer =================
export * from './domain-server';

// ================= Application Layer =================
export * from './application-client';

// ================= Infrastructure Layer =================
// Composition root, factories, and concrete adapters.
// Note: memory adapters and RepositoryRepositoryFactory are NOT exported from root.
// External consumers should use the package root helpers; package-internal code
// should use relative imports instead of reopening internal layer subpaths.
export {
  createRepositoryModule,
  createRepositoryUseCases,
  createRepositoryPowerSyncModule,
  type RepositoryModuleDependencies,
  type RepositoryModuleInstance,
  type RepositoryModuleRuntimeContribution,
  type RepositoryModuleUseCases,
} from './infrastructure-server';
export * from './infrastructure-client';

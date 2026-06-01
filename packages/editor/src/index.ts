/**
 * @dailyuse/editor
 *
 * 编辑器模块 - 资源编辑与工作区协同
 * Editor module - resource editing and workspace collaboration
 *
 * 【分层架构 / Layered Architecture】
 *
 * contracts           → 类型定义、DTO、事件、API Schema（@dailyuse/contracts/editor）
 *                       Type definitions, DTOs, events, API Schema
 * domain-shared       → 值对象（前后端共享）
 *                       Value objects (shared between client and server)
 * domain-server       → 聚合根、仓储接口、领域服务
 *                       Aggregates, repository interfaces, domain services
 * domain-client       → 客户端领域模型
 *                       Client-side domain models
 * application-server  → 用例服务（服务端）
 *                       Use case services (server-side)
 * application-client  → 客户端服务（前端 / 宿主注入）
 *                       Client-side services (frontend / host injected)
 * infrastructure-server → 仓储实现、组合根
 *                         Repository implementations, composition root
 * infrastructure-client → HTTP / IPC 客户端适配器
 *                         HTTP / IPC client adapters
 *
 * 【使用示例 / Usage】
 *
 * ```typescript
 * // 1. Import contracts / 导入契约
 * import type { EditorWorkspaceServerDTO } from '@dailyuse/contracts/editor';
 *
 * // 2. Import public aggregate + composition root / 导入公共聚合根和组合根
 * import { EditorWorkspace, createEditorModule } from '@dailyuse/editor';
 *
 * // 3. Use composition root / 使用组合根
 * const module = createEditorModule({ workspaceRepository, sessionRepository, groupRepository, tabRepository });
 * const result = await module.api.createWorkspace(props, context);
 * ```
 */

// ================= Contracts Layer (契约层) =================
// Type definitions, DTOs, Events, API Schemas
export * from '@dailyuse/contracts/editor';

// ================= Domain Layer (领域层) =================
export * from './domain-server';

// ================= Application Layer (应用层) =================
export * from './application-client';

// ================= Infrastructure Layer (基础设施层) =================
export * from './infrastructure-client';
export { createEditorModule, createEditorPowerSyncModule, type EditorApplicationPort, type EditorModuleDependencies, type EditorModuleInstance, type EditorModuleRuntimeContribution } from './infrastructure-server';

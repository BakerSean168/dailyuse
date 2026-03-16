/**
 * Infrastructure Server Layer - Barrel Export.
 * 基础设施服务端层 - 统一导出。
 *
 * Server-side infrastructure:
 * 服务端基础设施：
 * - Repository implementations (Prisma, PowerSync)
 *   仓储实现（Prisma、PowerSync）
 * - Persistence mappers
 *   持久化映射器
 * - Explicit composition root and runtime assembly
 *   显式组合根与运行时组装
 */

// ============ Adapters - Prisma ============
/** @internal Concrete Prisma implementation — use IEditorWorkspaceRepository interface instead. Prisma 具体实现 — 请使用 IEditorWorkspaceRepository 接口。 */
export { EditorWorkspacePrismaRepository } from './adapters/prisma';
/** @internal Concrete Prisma implementation — use IDocumentRepository interface instead. Prisma 具体实现 — 请使用 IDocumentRepository 接口。 */
export { DocumentPrismaRepository } from './adapters/prisma';

// ============ Adapters - PowerSync ============
/** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
export { PowerSyncEditorWorkspaceRepository } from './adapters/powersync';
/** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
export { PowerSyncDocumentRepository } from './adapters/powersync';

// ============ Composition Root ============
export {
  createEditorModule,
  type EditorApplicationPort,
  type EditorModuleDependencies,
  type EditorModuleInstance,
  type EditorModuleRuntimeContribution,
} from './editor.module';
export { createEditorPowerSyncModule } from './powersync';

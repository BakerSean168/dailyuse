/**
 * @dailyuse/ai
 *
 * AI 模块 - 对话管理、内容生成、配额管理、提供商配置
 *
 * 【分层架构】
 *
 * contracts        → 类型定义、DTO、事件、API Schema（在 @dailyuse/contracts/ai）
 * domain-shared    → 值对象（前后端共享）
 * domain-server    → 聚合根、仓储接口、领域服务
 * domain-client    → 客户端领域模型
 * application-server → 用例（服务端）
 * application-client → 客户端应用服务
 * infrastructure-server → Prisma/PowerSync 仓储、AI Provider 适配器
 * infrastructure-client → HTTP/IPC 适配器、AI Prompt 模板
 *
 * 【使用示例】
 *
 * ```typescript
 * // 1. 导入契约
 * import type { AIConversationDTO } from '@dailyuse/contracts/ai';
 *
 * // 2. 使用组合根 (推荐)
 * import { createAIModule } from '@dailyuse/ai/infrastructure-server';
 * const module = createAIModule({
 *   conversationRepository,
 *   providerConfigRepository,
 * });
 * const result = await module.api.createProvider(identityId, req);
 *
 * // 3. 导入客户端应用服务
 * import { AIClientService } from '@dailyuse/ai/application-client';
 * ```
 */

// ================= Contracts Layer (契约层) =================
export * from '@dailyuse/contracts/ai';

// ================= Domain Layer (领域层) =================
// domain-shared and domain-client are available via subpath exports only
// (e.g., @dailyuse/ai/domain-shared, @dailyuse/ai/domain-client)
export * from './domain-server';

// ================= Application Layer (应用层) =================
export * from './application-server';
// application-client is available via subpath export only
// (e.g., @dailyuse/ai/application-client) to avoid name conflicts

// ================= Infrastructure Layer (基础设施层) =================
export {
  // -- Composition Root (canonical entry point) --
  createAIModule,
  createAIUseCases,
  createAIServices,
  createAIPowerSyncModule,
  type AIModuleDependencies,
  type AIModuleInstance,
  type AIModuleUseCases,
  type AIModuleServices,
  type AIApplicationPort,
  type AIModuleRuntimeContribution,
  type AIRuntimeContributionsInput,
  type AIModulePowerSyncOptions,

  // -- Prisma Adapters --
  /** @internal Concrete Prisma implementation — use IAIConversationRepository interface instead. Prisma 具体实现 — 请使用 IAIConversationRepository 接口。 */
  AIConversationPrismaRepository,
  /** @internal Concrete Prisma implementation — use IAIProviderConfigRepository interface instead. Prisma 具体实现 — 请使用 IAIProviderConfigRepository 接口。 */
  AIProviderConfigPrismaRepository,

  // -- PowerSync Adapters --
  /** @internal Concrete PowerSync implementation — use IAIConversationRepository interface instead. PowerSync 具体实现 — 请使用 IAIConversationRepository 接口。 */
  PowerSyncAIConversationRepository,
  /** @internal Concrete PowerSync implementation — use IAIProviderConfigRepository interface instead. PowerSync 具体实现 — 请使用 IAIProviderConfigRepository 接口。 */
  PowerSyncAIProviderConfigRepository,
} from './infrastructure-server';

export * from './infrastructure-client';

// ================= API Layer (API 层) =================
export * from './api';

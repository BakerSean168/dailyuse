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
 * infrastructure-server → Prisma/SQLite 仓储、AI Provider 适配器
 * infrastructure-client → HTTP/IPC 适配器、AI Prompt 模板
 *
 * 【使用示例】
 *
 * ```typescript
 * // 1. 导入契约
 * import type { AIConversationDTO } from '@dailyuse/contracts/ai';
 *
 * // 2. 导入服务端领域
 * import { AIConversation } from '@dailyuse/ai/domain-server';
 *
 * // 3. 导入客户端应用服务
 * import { AiApplicationService } from '@dailyuse/ai/application-client';
 * ```
 */

// ================= Contracts Layer =================
export * from '@dailyuse/contracts/ai';

// ================= Domain Layer =================
export * from './domain-shared';
export * from './domain-server';
export * from './domain-client';

// ================= Application Layer =================
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer =================
export * from './infrastructure-server';
export * from './infrastructure-client';

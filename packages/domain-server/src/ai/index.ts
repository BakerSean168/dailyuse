/**
 * AI Module - Domain Server Layer
 * AI 模块 - 领域服务层导出
 *
 * DDD 原则：
 * - 只导出领域层纯业务逻辑
 * - 不包含基础设施实现（Adapters、Prompt 模板等）
 * - 基础设施细节由 API 层的 infrastructure/ 处理
 *
 * 导出内容：
 * - 聚合根（Aggregates）
 * - 实体（Entities）
 * - 值对象（Value Objects）
 * - 仓储接口（Repository Interfaces）
 * - 领域服务（Domain Services）
 * - 领域错误（Domain Errors）
 */

// ===== Aggregates =====
export * from './aggregates/AIConversation';
// 为了向后兼容，导出 AIConversation 别名为 AIConversationServer
export { AIConversation as AIConversationServer } from './aggregates/AIConversation';
export * from './aggregates/AIUsageQuotaServer';
export * from './aggregates/AIProviderConfigServer';

// ===== Entities =====
export * from './entities/Message';
// 为了向后兼容，导出 Message 别名为 MessageServer
export { Message as MessageServer } from './entities/Message';
export * from './entities/KnowledgeGenerationTask';

// ===== Value Objects =====
export * from './value-objects/GenerationInput';
export * from './value-objects/TokenUsage';

// ===== Repositories =====
export * from './repositories';

// ===== Domain Services =====
export * from './services';

// ===== Domain Errors =====
export * from './errors/AIErrors';

// ===== Interfaces =====
export * from './interfaces/adapter-types';

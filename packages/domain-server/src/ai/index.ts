/**
 * AI Module - Domain Server
 * AI 模块 - 领域服务端
 * 
 * 【模块职责】
 * 管理 AI 功能的核心业务逻辑，包括对话管理、内容生成、配额管理、提供商配置等
 * 
 * 【包含内容】
 * - 聚合根（Aggregates）：AIConversation, AIUsageQuota, AIProviderConfig
 * - 实体（Entities）：Message, KnowledgeGenerationTask
 * - 值对象（Value Objects）：GenerationInput, TokenUsage
 * - 仓储接口（Repositories）：IAIConversationRepository, IAIUsageQuotaRepository 等
 * - 领域服务（Domain Services）：AIGenerationService, QuotaManagementService
 * - 领域错误（Domain Errors）：AIErrors - AI 相关业务异常
 * - 适配器接口（Adapter Interfaces）：定义与 AI 提供商的集成接口
 * 
 * 【业务特性】
 * - AI 对话：多轮对话管理、上下文维护
 * - 内容生成：目标生成、任务生成、知识生成
 * - 配额管理：Token 消耗跟踪、配额限制、重置策略
 * - 提供商管理：多 AI 提供商支持（OpenAI, Claude, 国产大模型）
 * - 知识库：RAG 知识生成任务管理
 * 
 * 【DDD 原则】
 * - 纯业务逻辑：只包含领域层的业务规则
 * - 基础设施分离：不包含 Prompt 模板、Adapter 实现
 * - 接口隔离：通过 Adapter 接口与外部 AI 服务集成
 * 
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils（基类：AggregateRoot, Entity）
 * - @dailyuse/contracts（DTO 接口、事件 Map）
 * - @dailyuse/domain-shared（值对象、枚举）
 * 
 * ❌ 禁止依赖：
 * - @dailyuse/domain-client（客户端领域模型）
 * - @dailyuse/infrastructure-*（基础设施层）
 * - @dailyuse/application-*（应用层）
 * - 外部 I/O 库（axios, openai-sdk 等）
 */

// ===== Aggregates =====
export * from './aggregates';


// ===== Entities =====
export * from './entities';

// ===== Value Objects =====
export * from './value-objects';


// ===== Repositories =====
export * from './repositories';

// ===== Domain Services =====
export * from './services';

// ===== Domain Errors =====
export * from './errors/AIErrors';

// ===== Interfaces =====
export * from './interfaces/adapter-types';

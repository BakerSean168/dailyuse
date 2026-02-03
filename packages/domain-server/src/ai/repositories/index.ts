/**
 * AI Repositories
 * AI 模块 - 仓储接口导出
 * 
 * 【规范说明：仓储（Repository）】
 * 仓储是聚合根的持久化变量市场，应遵循以下原则：
 * - 只接口不接实现：其仓储接口帮助 DDD 的 Transactional Boundaries
 * - 单个聚合根一个仓储：一个聚合根不应该有多个仓储
 * - 聚合内的实体不会直接指接仓储：需要通过聚合根访问
 * - 根据聊天斤团决分：一次只修改一个聚合根
 * 
 * 【IAIConversationRepository】
 * - AI 对话持久化：保存、查询、更新对话历史
 * 
 * 【IAIUsageQuotaRepository】
 * - Token 使用跽踪持久化：跽踪 Token 消耗、费用、额度
 * 
 * 【IAIProviderConfigRepository】
 * - 提供商配置持久化：管理 OpenAI、Claude 等配置
 * 
 * 【IAIGenerationTaskRepository】
 * - 生成任务持久化：保存 AI 的长业务务
 * 
 * 【IKnowledgeGenerationTaskRepository】
 * - 知识甬府生成任务持久化：扩展模型知识
 */

export * from './IAIConversationRepository';
export * from './IAIGenerationTaskRepository';
export * from './IAIUsageQuotaRepository';
export * from './IKnowledgeGenerationTaskRepository';
export * from './IAIProviderConfigRepository';

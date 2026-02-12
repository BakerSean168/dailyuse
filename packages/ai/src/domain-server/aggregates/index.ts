/**
 * AI Aggregates
 * AI 模块聚合根导出
 * 
 * 【规范说明：聚合根（Aggregate Root）】
 * 聚合根是 DDD 中的核心概念：
 * - 聚合的入口点：外部只能通过聚合根访问聚合内的实体
 * - 事务边界：一次事务只能修改一个聚合根
 * - 不变量守护者：确保聚合内的业务规则始终满足
 * - 领域事件发布者：状态变更时发出领域事件
 * 
 * 【AIConversation 聚合根】
 * - 对话管理：多轮 AI 对话的上下文和状态管理
 * - 消息管理：消息列表、角色、内容、标记等
 * - 上下文维护：对话历史、上下文窗口、会话状态
 * 
 * 【AIUsageQuota 聚合根】
 * - Token 计费管理：记录 AI 使用的 token 数量和费用
 * - 额度控制：用户的月度/日度配额限制和消耗追踪
 * - 费用统计：计算成本、预警超额等
 * 
 * 【AIProviderConfig 聚合根】
 * - 提供商配置管理：API Key、Model、Temperature 等参数
 * - 切换策略：不同 Provider 的切换和 Fallback
 * - 限流控制：速率限制、并发控制
 */

export { AIConversation } from './ai-conversation';
export { AIProviderConfig } from './ai-provider-config';
export { AIUsageQuota } from './ai-usage-quota';

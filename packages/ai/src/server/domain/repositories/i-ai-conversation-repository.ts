/**
 * AI Conversation Repository Interface
 * AI 对话仓储接口
 *
 * DDD 仓储模式：
 * - 操作领域对象（聚合根），不直接操作数据库模型
 * - 由基础设施层实现（Prisma / PowerSync / memory）
 * - 聚合根模式：级联保存/加载 AIMessage
 */

import type { AIConversation } from '../aggregates/ai-conversation';

/**
 * 查询选项
 */
export interface AIConversationQueryOptions {
  includeChildren?: boolean;
}

/**
 * IAIConversationRepository 仓储接口
 *
 * 职责：
 * - AI 对话聚合根的持久化操作
 * - 级联保存对话消息
 * - 按账户查询对话（列表分页由应用层基于 findByIdentityId 完成）
 */
export interface IAIConversationRepository {
  /**
   * 保存对话（创建或更新）
   * 注意：级联保存所有消息
   */
  save(conversation: AIConversation): Promise<void>;

  /**
   * 按账户 + 对话 ID 查找（唯一读路径；禁止 bare PK 授权）
   */
  findByIdForIdentity(
    identityId: string,
    id: string,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation | null>;

  /**
   * 根据账户 UUID 查找所有对话
   */
  findByIdentityId(
    identityId: string,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]>;

  /**
   * 删除对话（级联删除所有消息）
   */
  delete(identityId: string, id: string): Promise<void>;
}

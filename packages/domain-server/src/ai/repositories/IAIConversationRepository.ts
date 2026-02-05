/**
 * AI Conversation Repository Interface
 * AI 对话仓储接口
 *
 * DDD 仓储模式：
 * - 操作领域对象（聚合根），不直接操作数据库模型
 * - 由基础设施层实现（Prisma）
 * - 聚合根模式：级联保存/加载 AIMessage
 */

import type { AIConversation } from '../aggregates/ai-conversation';
import { ConversationStatus } from '@dailyuse/contracts/ai';

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
 * - 按账户、状态查询对话
 */
export interface IAIConversationRepository {
  /**
   * 保存对话（创建或更新）
   * 注意：级联保存所有消息
   */
  save(conversation: AIConversation): Promise<void>;

  /**
   * 根据 UUID 查找对话
   * @param options.includeChildren 是否加载消息（默认 false）
   */
  findByUuid(uuid: string, options?: AIConversationQueryOptions): Promise<AIConversation | null>;

  /**
   * 根据账户 UUID 查找所有对话
   */
  findByAccountUuid(accountUuid: string, options?: AIConversationQueryOptions): Promise<AIConversation[]>;

  /**
   * 根据状态查找对话
   */
  findByStatus(
    accountUuid: string,
    status: ConversationStatus,
    options?: AIConversationQueryOptions,
  ): Promise<AIConversation[]>;

  /**
   * 查找最近的对话（分页）
   */
  findRecent(
    accountUuid: string,
    limit: number,
    offset?: number,
  ): Promise<AIConversation[]>;

  /**
   * 删除对话（级联删除所有消息）
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查对话是否存在
   */
  exists(uuid: string): Promise<boolean>;
}

/**
 * Knowledge Generation Task Repository Interface (Story 4.3)
 * 知识系列生成任务仓储接口
 */

import type { KnowledgeGenerationTask } from '../entities/knowledge-generation-task';

export interface IKnowledgeGenerationTaskRepository {
  /**
   * 创建新任务
   */
  create(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask>;

  /**
   * 根据 ID 查找任务
   */
  findById(id: string): Promise<KnowledgeGenerationTask | null>;

  /**
   * 根据身份 ID 查找任务列表
   */
  findByIdentityId(identityId: string): Promise<KnowledgeGenerationTask[]>;

  /**
   * 更新任务
   */
  update(task: KnowledgeGenerationTask): Promise<KnowledgeGenerationTask>;

  /**
   * 删除任务
   */
  delete(id: string): Promise<void>;
}

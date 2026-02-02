/**
 * Example 领域服务
 * 
 * 【规范说明：Domain Service】
 * 
 * 领域服务用于处理不适合放在聚合根中的业务逻辑：
 * - 跨多个聚合根的操作
 * - 需要调用外部服务的操作
 * - 复杂的业务流程编排
 * 
 * 【何时使用 Domain Service？】
 * - 操作涉及多个聚合根
 * - 操作需要外部依赖（如 Repository、Event Bus）
 * - 操作无法自然地归属于某个聚合根
 * 
 * 【何时不使用 Domain Service？】
 * - 操作只涉及单个聚合根的内部状态变更
 * - 操作是简单的 CRUD（用 Application Service）
 */

import type { Example } from '../aggregates/Example';
import type { IExampleRepository } from '../repositories/IExampleRepository';
import type { ExampleId } from '@dailyuse/domain-shared/example';
import type { IdentityId } from '@dailyuse/contracts/primitives';

export class ExampleDomainService {
  constructor(
    private readonly exampleRepository: IExampleRepository,
  ) {}

  /**
   * 批量激活 Examples
   * 
   * 这是一个领域服务方法的示例：
   * - 涉及多个聚合根
   * - 需要 Repository 依赖
   * - 有跨实体的业务规则
   */
  async batchActivate(ids: ExampleId[], actorId: IdentityId): Promise<{
    success: ExampleId[];
    failed: Array<{ id: ExampleId; reason: string }>;
  }> {
    const success: ExampleId[] = [];
    const failed: Array<{ id: ExampleId; reason: string }> = [];

    for (const id of ids) {
      try {
        const example = await this.exampleRepository.findById(id);
        
        if (!example) {
          failed.push({ id, reason: 'Not found' });
          continue;
        }

        // 权限检查：只有所有者可以激活
        if (example.identityId !== actorId) {
          failed.push({ id, reason: 'Permission denied' });
          continue;
        }

        // 执行业务操作
        example.activate();
        await this.exampleRepository.save(example);
        
        success.push(id);
      } catch (error) {
        failed.push({ 
          id, 
          reason: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return { success, failed };
  }

  /**
   * 检查用户是否可以创建更多 Example
   * 
   * 业务规则：每个用户最多 100 个 Example
   */
  async canCreateMore(identityId: IdentityId): Promise<boolean> {
    const count = await this.exampleRepository.countByIdentityId(identityId);
    return count < 100; // 配置常量应该从 contracts/configs 引入
  }

  /**
   * 转移所有权
   * 
   * 复杂的跨实体操作示例
   */
  async transferOwnership(
    exampleId: ExampleId,
    fromId: IdentityId,
    toId: IdentityId,
  ): Promise<void> {
    const example = await this.exampleRepository.findById(exampleId);
    
    if (!example) {
      throw new Error('Example not found');
    }

    if (example.identityId !== fromId) {
      throw new Error('Only owner can transfer ownership');
    }

    // 这里需要修改 identityId，但聚合根通常不允许直接修改
    // 这种情况可能需要特殊处理或重新设计
    // 作为示例，这里假设有一个内部方法
    throw new Error('Transfer ownership not implemented in this example');
  }
}

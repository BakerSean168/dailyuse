/**
 * Example 领域服务
 * 
 * 【规范说明：Domain Service】
 * 按照用例拆分领域服务，避免单一服务过大
 * 领域服务用于处理不适合放在聚合根中的业务逻辑：
 * 
 * 【何时使用 Domain Service】
 * ✅ 跨聚合根操作：
 *    - 操作涉及多个聚合根实例
 *    - 需要协调多个聚合根的状态变更
 *    - 示例：批量激活多个 Example
 * 
 * ✅ 需要外部依赖：
 *    - 需要调用 Repository 查询数据
 *    - 需要调用外部服务（发送邮件、调用第三方 API）
 *    - 示例：检查用户配额需要查询数据库
 * 
 * ✅ 无自然归属：
 *    - 操作逻辑不自然地属于任何一个聚合根
 *    - 强行放入聚合根会破坏单一职责原则
 *    - 示例：转移所有权涉及两个用户的业务规则
 * 
 * 【何时不使用 Domain Service】
 * ❌ 单聚合根操作：
 *    - 只涉及一个聚合根的内部状态变更
 *    - 应该放在聚合根的业务方法中
 *    - 示例：example.activate() 应在聚合根内
 * 
 * ❌ 简单 CRUD：
 *    - 直接调用 Repository 的增删改查
 *    - 没有业务规则校验
 *    - 应该放在 Application Service 中
 * 
 * ❌ 应用层关注点：
 *    - UI 展示逻辑、数据格式转换
 *    - 请求参数校验、权限检查
 *    - 应该放在 Application Service 中
 * 
 * 【Domain Service vs Application Service】
 * - Domain Service：包含核心业务规则，可复用于多个应用场景
 * - Application Service：编排用例流程，处理应用层关注点（事务、权限、日志）
 * 
 * 【设计原则】
 * 1. 无状态（Stateless）：不应该持有实例状态
 * 2. 依赖接口：依赖 Repository 接口，不是具体实现
 * 3. 纯粹业务：只包含业务逻辑，不包含技术细节
 * 4. 可测试：通过 Mock Repository 进行单元测试
 * 
 * 【参考 authentication 模块】
 * 查看 RegistrationService 了解用户注册的复杂业务编排
 */

import type { Example } from '../aggregates/example';
import type { IExampleRepository } from '../repositories/IExampleRepository';
import type { ExampleId } from '@/domain-shared';
import type { IdentityId } from '@dailyuse/contracts/primitives';

/**
 * FeatureOne 领域服务
 * 
 * 【依赖注入】
 * 通过构造函数注入 Repository 接口
 * 具体实现由 DI 容器提供
 */
export class FeatureOne {
  constructor(
    private readonly exampleRepository: IExampleRepository,
  ) {}

  /**
   * 批量激活 Examples
   * 
   * 【设计说明】
   * 这是一个典型的领域服务方法：
   * - 涉及多个聚合根：需要加载多个 Example 实例
   * - 需要 Repository：从数据库查询和保存
   * - 跨实体业务规则：权限检查、状态校验
   * 
   * 【返回值设计】
   * 返回详细的成功/失败信息，便于：
   * - Application Layer 反馈给用户
   * - 记录操作日志
   * - 统计成功率
   * 
   * 【事务处理】
   * 本方法不处理事务边界：
   * - 事务由 Application Service 控制
   * - 或者在 Repository 实现中处理
   * 
   * @param ids - 要激活的 Example ID 列表
   * @param actorId - 执行操作的用户 ID
   * @returns 成功和失败的详细信息
   */
  async batchActivate(ids: ExampleId[], actorId: IdentityId): Promise<{
    success: ExampleId[];
    failed: Array<{ id: ExampleId; reason: string }>;
  }> {
    const success: ExampleId[] = [];
    const failed: Array<{ id: ExampleId; reason: string }> = [];

    for (const id of ids) {
      try {
        // 1. 加载聚合根
        const example = await this.exampleRepository.findById(id);
        
        if (!example) {
          failed.push({ id, reason: 'Not found' });
          continue;
        }

        // 2. 业务规则校验：权限检查
        // 只有所有者可以激活自己的 Example
        if (example.identityId !== actorId) {
          failed.push({ id, reason: 'Permission denied' });
          continue;
        }

        // 3. 执行业务操作
        // 调用聚合根的业务方法，聚合根内部会：
        // - 检查状态转换是否合法
        // - 修改内部状态
        // - 发出领域事件
        example.activate();
        
        // 4. 持久化
        await this.exampleRepository.save(example);
        
        success.push(id);
      } catch (error) {
        // 5. 错误处理
        // 捕获业务异常并记录到失败列表
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
   * 【设计说明】
   * 这是一个跨聚合根的业务规则：
   * - 规则：每个用户最多 100 个 Example
   * - 需要查询：统计现有数量
   * - 不属于任何单个 Example：是用户级别的限制
   * 
   * 【配置管理】
   * 配额上限应该：
   * - 定义在 contracts/configs 中
   * - 支持不同用户等级有不同配额
   * - 本示例简化为硬编码 100
   * 
   * @param identityId - 用户 ID
   * @returns true 可以创建，false 已达上限
   */
  async canCreateMore(identityId: IdentityId): Promise<boolean> {
    const count = await this.exampleRepository.countByIdentityId(identityId);
    const MAX_EXAMPLES_PER_USER = 100; // 应该从配置中读取
    return count < MAX_EXAMPLES_PER_USER;
  }

  /**
   * 转移所有权
   * 
   * 【设计说明】
   * 这是一个复杂的跨实体操作示例：
   * - 涉及两个用户：转出方和接收方
   * - 业务规则：只有所有者可以转移
   * - 后续扩展：可能需要接收方确认
   * 
   * 【实现挑战】
   * identityId 通常是聚合根的不可变属性：
   * - 方案1：提供特殊的内部方法 transferOwnership()
   * - 方案2：创建新的聚合根实例，删除旧的
   * - 方案3：使用领域事件，异步处理转移
   * 
   * 【示例限制】
   * 本示例未完整实现，仅展示接口设计
   * 生产环境需要根据实际需求选择方案
   * 
   * @param exampleId - Example ID
   * @param fromId - 当前所有者 ID
   * @param toId - 新所有者 ID
   * @throws Error 如果 Example 不存在或权限不足
   */
  async transferOwnership(
    exampleId: ExampleId,
    fromId: IdentityId,
    toId: IdentityId,
  ): Promise<void> {
    // 1. 加载聚合根
    const example = await this.exampleRepository.findById(exampleId);
    
    if (!example) {
      throw new Error('Example not found');
    }

    // 2. 权限校验
    if (example.identityId !== fromId) {
      throw new Error('Only owner can transfer ownership');
    }

    // 3. 业务规则校验
    // 未来可以添加更多规则：
    // - 接收方是否有权限接收
    // - 接收方是否已达配额上限
    // - 是否需要接收方确认

    // 4. 执行转移
    // 这里需要特殊处理，因为 identityId 通常是不可变的
    // 实际实现需要根据业务需求选择合适的方案
    throw new Error('Transfer ownership not fully implemented in this example');
    
    // 可能的实现方式：
    // example.transferOwnership(toId); // 需要在聚合根中添加特殊方法
    // await this.exampleRepository.save(example);
  }
}

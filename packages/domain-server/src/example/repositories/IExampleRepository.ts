/**
 * Example Repository 接口定义
 * 
 * 【规范说明：Repository 模式】
 * 
 * Repository 是领域模型和数据持久化之间的抽象层：
 * - 定义在 domain-server 包中（接口）
 * - 实现在 infrastructure-server 包中（具体实现）
 * 
 * 这样做的好处：
 * - 领域模型不依赖具体的数据库实现
 * - 便于测试（可以用 InMemory 实现替换）
 * - 符合依赖倒置原则（DIP）
 */

import type { Example } from '../aggregates/Example';
import type { ExampleId } from '@dailyuse/domain-shared/example';
import type { IdentityId } from '@dailyuse/contracts/primitives';

/**
 * Example 仓储接口
 */
export interface IExampleRepository {
  /**
   * 根据 ID 查找 Example
   * 
   * @returns Example 实体，如果不存在返回 null
   */
  findById(id: ExampleId): Promise<Example | null>;

  /**
   * 根据用户 ID 查找所有 Example
   * 
   * @param identityId - 用户 ID
   * @param options - 查询选项
   */
  findByIdentityId(
    identityId: IdentityId,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Example[]>;

  /**
   * 保存 Example（新增或更新）
   * 
   * 【规范说明】
   * - 如果是新实体，执行 INSERT
   * - 如果是已存在实体，执行 UPDATE
   * - 保存后应该处理领域事件
   */
  save(example: Example): Promise<void>;

  /**
   * 删除 Example
   * 
   * 【规范说明】
   * 根据业务需求选择：
   * - 硬删除：物理删除数据
   * - 软删除：设置 deletedAt 字段
   */
  delete(id: ExampleId): Promise<void>;

  /**
   * 检查 Example 是否存在
   */
  exists(id: ExampleId): Promise<boolean>;

  /**
   * 统计用户的 Example 数量
   */
  countByIdentityId(identityId: IdentityId): Promise<number>;
}

/**
 * Repository 注入 Token
 * 
 * 用于 DI 容器中注册和解析 Repository
 */
export const EXAMPLE_REPOSITORY_TOKEN = Symbol('IExampleRepository');

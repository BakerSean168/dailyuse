/**
 * Example Repository 接口定义
 * 
 * 【规范说明：Repository 模式】
 * 
 * Repository 是领域模型和数据持久化之间的抽象层：
 * - 接口定义：在 domain-server 包中定义接口
 * - 具体实现：在 infrastructure-server 包中实现（如 Prisma, TypeORM）
 * - 依赖倒置：领域层不依赖具体的数据库技术
 * 
 * 【设计优势】
 * ✅ 领域纯净性：领域模型不包含 SQL、ORM 等基础设施代码
 * ✅ 可测试性：可以用 InMemory 实现替换，方便单元测试
 * ✅ 可替换性：可以轻松切换数据库实现（Prisma → TypeORM）
 * ✅ 符合 DIP：高层模块不依赖低层模块，都依赖抽象
 * 
 * 【Repository 设计原则】
 * 1. 以聚合根为单位：Repository 对应聚合根，不是数据库表
 * 2. 返回领域对象：返回聚合根实例，不是 ORM 对象
 * 3. 使用值对象：参数使用值对象（ExampleId），不是原始类型（string）
 * 4. 体现业务意图：方法名体现业务含义（findActiveExamples），不是技术操作（select）
 * 5. 封装查询逻辑：复杂查询逻辑封装在 Repository 内部
 * 
 * 【参考 authentication 模块】
 * 查看 IAuthIdentityRepository 了解更多最佳实践
 */

import type { Example } from '../aggregates/example';
import type { ExampleId } from '@dailyuse/domain-shared/example';
import type { IdentityId } from '@dailyuse/contracts/primitives';

/**
 * Example 仓储接口
 * 负责 Example 聚合根的持久化和查询
 */
export interface IExampleRepository {
  /**
   * ✅ 保存或更新 Example
   * 
   * 【设计说明】
   * - 新增时：将聚合根持久化到数据库
   * - 更新时：比对变更并更新（或全量覆盖）
   * - 发布事件：保存后需要发布聚合根内的领域事件
   * 
   * 【实现建议】
   * - 使用 Upsert 语句处理新增/更新
   * - 事务包裹：确保数据一致性
   * - 事件发布：保存成功后发布事件到 EventBus
   * 
   * @param example - 要保存的 Example 聚合根
   */
  save(example: Example): Promise<void>;

  /**
   * 🔍 根据 ID 查找 Example
   * 
   * 【使用场景】
   * - 获取单个 Example 详情
   * - 修改 Example 前先加载
   * - 权限校验时检查所有者
   * 
   * @param id - Example ID（值对象）
   * @returns Example 聚合根实例，如果不存在返回 null
   */
  findById(id: ExampleId): Promise<Example | null>;

  /**
   * 🔍 根据用户 ID 查找 Example 列表
   * 
   * 【使用场景】
   * - 用户的 Example 列表页
   * - 按状态过滤（Draft, Active, Archived）
   * - 分页查询
   * 
   * @param identityId - 用户 ID（值对象）
   * @param options - 查询选项
   * @param options.status - 状态过滤（可选）
   * @param options.limit - 每页数量（默认 20）
   * @param options.offset - 偏移量（默认 0）
   * @returns Example 数组
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
   * 🗑️ 删除 Example
   * 
   * 【软删除 vs 硬删除】
   * - 推荐软删除：设置 deletedAt 字段，数据可恢复
   * - 硬删除场景：用户明确要求永久删除，合规要求（GDPR）
   * 
   * 【实现建议】
   * - 本示例使用软删除（设置 deletedAt）
   * - 查询时自动过滤已删除数据（WHERE deletedAt IS NULL）
   * - 提供 permanentDelete() 方法用于真正删除
   * 
   * @param id - Example ID（值对象）
   */
  delete(id: ExampleId): Promise<void>;

  /**
   * 🛡️ 检查 Example 是否存在
   * 
   * 【性能优化】
   * - 只检查存在性，不加载完整数据
   * - SQL: SELECT EXISTS(SELECT 1 FROM examples WHERE id = ?)
   * - 比 findById() 更高效
   * 
   * @param id - Example ID（值对象）
   * @returns true 存在，false 不存在
   */
  exists(id: ExampleId): Promise<boolean>;

  /**
   * 📊 统计用户的 Example 数量
   * 
   * 【使用场景】
   * - 配额检查：用户是否超过创建上限
   * - 统计展示：Dashboard 显示总数
   * - 分页计算：计算总页数
   * 
   * @param identityId - 用户 ID（值对象）
   * @returns Example 总数（不包括已删除的）
   */
  countByIdentityId(identityId: IdentityId): Promise<number>;
}

/**
 * Repository 注入 Token
 * 
 * 用于 DI 容器中注册和解析 Repository
 */
export const EXAMPLE_REPOSITORY_TOKEN = Symbol('IExampleRepository');

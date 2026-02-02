/**
 * Example API - Request DTOs
 * 
 * 【规范说明：Request DTO（请求数据对象）】
 * 用于 HTTP 请求的 body 或 query 参数。特点：
 * 1. 所有字段都应该是可选或有默认值（用户可能不填）
 * 2. 字段应该使用易用的基础类型（string, number）
 * 3. 包含业务级别的验证描述（供 Swagger 或验证库使用）
 * 4. 不包含 ID（除非是更新操作）
 * 
 * 【重要】
 * 严禁混淆 Request DTO 和 Application Service DTO：
 * - Request DTO：用户输入格式，通常来自 HTTP
 * - Service DTO：内部业务逻辑格式，可能包含计算或转换
 */

/**
 * 创建 Example 的请求
 * 【规范说明：Create Request】
 * - 不包含 id（由后端生成）
 * - 不包含 status（默认为 Draft）
 * - 不包含时间戳（由后端设置）
 * - 所有 required 字段都是业务必需的
 */
export interface CreateExampleRequest {
  /**
   * Example 的名称
   * @example "My First Example"
   * @minLength 1
   * @maxLength 256
   */
  name: string;

  /**
   * Optional 描述
   * @maxLength 2000
   */
  description?: string;

  /**
   * 优先级（1-10）
   * @minimum 1
   * @maximum 10
   * @default 5
   */
  priority?: number;

  /**
   * 是否公开
   * @default false
   */
  isPublic?: boolean;
}

/**
 * 更新 Example 的请求
 * 【规范说明：Update Request】
 * - 所有字段都是可选的（客户端只发送要修改的字段）
 * - 不能更新 id, createdAt
 * - status 的修改可能需要额外权限
 * - 实现 PATCH 语义（部分更新），不是 PUT（完全替换）
 */
export interface UpdateExampleRequest {
  /**
   * Example 的名称
   * @minLength 1
   * @maxLength 256
   */
  name?: string;

  /**
   * 描述
   * @maxLength 2000
   * @nullable true
   */
  description?: string | null;

  /**
   * 优先级（1-10）
   * @minimum 1
   * @maximum 10
   */
  priority?: number;

  /**
   * 是否公开
   */
  isPublic?: boolean;

  /**
   * 新的状态
   * 【规范说明：Status 转移】
   * - Draft → Active：发布，触发验证
   * - Active → Archived：归档，不可逆
   * - Draft → Rejected：被拒绝（通常由其他人操作）
   * 
   * 可能的值：'Draft', 'Active', 'Archived', 'Rejected'
   */
  status?: string;
}

/**
 * 列表查询请求
 * 【规范说明：List Query DTO】
 * - 应该包含分页参数（page, limit）
 * - 应该包含排序参数（sortBy, sortOrder）
 * - 应该包含过滤参数
 * - 所有都是可选的（有合理默认值）
 */
export interface ListExampleQuery {
  /**
   * 页码（从 1 开始）
   * @default 1
   */
  page?: number;

  /**
   * 每页数量
   * @default 20
   * @maximum 100
   */
  limit?: number;

  /**
   * 排序字段
   * @default "createdAt"
   */
  sortBy?: 'name' | 'priority' | 'createdAt' | 'updatedAt' | 'viewCount';

  /**
   * 排序顺序
   * @default "desc"
   */
  sortOrder?: 'asc' | 'desc';

  /**
   * 按状态过滤
   * 可以是单个值或数组（逗号分隔）
   */
  status?: string;

  /**
   * 按名称搜索（模糊匹配）
   */
  search?: string;

  /**
   * 按优先级范围过滤
   * @example "5,10" 表示 5 到 10
   */
  priorityRange?: string;

  /**
   * 仅返回公开的 Examples
   * @default false
   */
  publicOnly?: boolean;
}

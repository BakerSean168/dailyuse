/**
 * ExampleId 品牌化 ID 类型
 * 
 * 【规范说明：Type 类型值对象 - 参考 domain-shared-type-value-object-spec.md】
 * 
 * 这是一个 Branded Type（品牌化类型）的 ID 实现：
 * - 编译时类型安全（防止 ID 类型混淆）
 * - 运行时就是普通 string（零开销）
 * - 提供工厂方法和校验
 * 
 * 【为什么需要品牌化 ID？】
 * ```typescript
 * // 没有品牌化：容易混淆
 * function getUser(userId: string, orderId: string) { ... }
 * getUser(orderId, userId); // 编译通过，但参数传反了！
 * 
 * // 有品牌化：编译时检查
 * function getUser(userId: UserId, orderId: OrderId) { ... }
 * getUser(orderId, userId); // ❌ 编译错误！
 * ```
 */

// 品牌化类型定义
declare const ExampleIdBrand: unique symbol;

/**
 * ExampleId 类型
 * 
 * 本质是 string，但通过 Brand 标记使其与其他 string 类型不兼容
 */
export type ExampleId = string & { readonly [ExampleIdBrand]: typeof ExampleIdBrand };

/**
 * ExampleId 工具对象
 * 
 * 【规范说明】
 * - of(): 从原始 string 创建（包含校验）
 * - generate(): 生成新 ID
 * - isValid(): 校验 ID 格式
 */
export const ExampleId = {
  /**
   * 从 string 创建 ExampleId（包含校验）
   * 
   * @throws 当 ID 格式不合法时
   * 
   * @example
   * ```typescript
   * const id = ExampleId.of('ex_abc123');
   * ```
   */
  of(value: string): ExampleId {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ExampleId format: ${value}`);
    }
    return value as ExampleId;
  },

  /**
   * 生成新的 ExampleId
   * 
   * 格式：ex_{uuid}
   * 
   * @example
   * ```typescript
   * const newId = ExampleId.generate();
   * // 'ex_550e8400-e29b-41d4-a716-446655440000'
   * ```
   */
  generate(): ExampleId {
    const uuid = crypto.randomUUID();
    return `ex_${uuid}` as ExampleId;
  },

  /**
   * 校验 ID 格式
   * 
   * 规则：
   * - 前缀：ex_
   * - 后缀：UUID v4 格式
   */
  isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    // 格式：ex_{uuid}
    const pattern = /^ex_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return pattern.test(value);
  },

  /**
   * 从任意 string 安全创建（返回 null 而不是抛异常）
   */
  tryParse(value: string): ExampleId | null {
    return this.isValid(value) ? (value as ExampleId) : null;
  },

  /**
   * 将 ExampleId 转为普通 string
   * 
   * 用于：序列化、日志打印、比较等
   */
  toString(id: ExampleId): string {
    return id;
  },
} as const;

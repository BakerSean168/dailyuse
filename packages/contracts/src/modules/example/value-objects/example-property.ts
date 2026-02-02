/**
 * ExampleProperty Value Object
 * 
 * 【规范说明：Value Object 的作用】
 * Value Object 是不变对象（Immutable），代表领域中的一个值。
 * 与 Entity 不同：
 * - Entity：有唯一 ID，生命周期长，可变
 * - Value Object：无 ID，通过值来判断相等性，不可变
 * 
 * 这个文件展示如何定义一个复杂的、可复用的 Value Object。
 */

/**
 * 传输层 DTO（数据传输对象）
 * - 用于序列化/反序列化
 * - 直接对应数据库字段或 API 响应
 * - 使用基础类型（string, number, boolean）
 */
export interface ExamplePropertyDTO {
  key: string;
  value: string;
  description: string | null;
}

/**
 * 领域层 Value Object
 * - 包含验证逻辑和业务不变量
 * - 可以包含方法来封装业务行为
 * - 类型比 DTO 更严格
 */
export interface ExampleProperty {
  readonly key: string;
  readonly value: string;
  readonly description: string | null;

  /**
   * 【规范说明：Value Object 方法】
   * Value Object 可以包含方法，但这些方法应该是：
   * 1. 无副作用的（纯函数）
   * 2. 返回新对象或基础类型（不修改自身）
   */
  equals(other: ExampleProperty): boolean;
}

/**
 * 【规范说明：工厂函数】
 * 使用工厂函数而不是 `new` 来创建 Value Object
 * 好处：
 * 1. 可以进行验证
 * 2. 如果实现改变，调用方代码不变
 * 3. 支持缓存/对象池优化
 */
export function createExampleProperty(input: ExamplePropertyDTO): ExampleProperty {
  // 【规范说明：验证】
  // 所有输入验证都应该在工厂函数中进行
  if (!input.key || input.key.trim().length === 0) {
    throw new Error('ExampleProperty.key cannot be empty');
  }

  if (!input.value || input.value.trim().length === 0) {
    throw new Error('ExampleProperty.value cannot be empty');
  }

  if (input.key.length > 256) {
    throw new Error('ExampleProperty.key must not exceed 256 characters');
  }

  return {
    key: input.key.trim(),
    value: input.value.trim(),
    description: input.description?.trim() ?? null,
    equals(other: ExampleProperty): boolean {
      return (
        this.key === other.key &&
        this.value === other.value &&
        this.description === other.description
      );
    },
  };
}

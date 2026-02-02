/**
 * ExampleProperty 值对象
 * 
 * 【规范说明：Class 类型值对象 - 参考 domain-shared-class-value-object-spec.md】
 * 
 * 这是一个典型的 Class 类型值对象实现，展示：
 * 1. 继承 ValueObject<DTO> 基类
 * 2. 私有构造函数 + 工厂方法模式
 * 3. 校验逻辑集中管理
 * 4. 不可变性（所有修改返回新实例）
 * 5. 逻辑下沉（toDTO/toPersistence 在值对象内部）
 * 
 * 【核心原则】
 * - Isomorphic（同构）：Browser/Node.js/Electron 都能运行
 * - Pure Logic（纯逻辑）：只包含校验、格式化、计算
 * - No Side Effects（无副作用）：禁止 I/O 操作
 * - Immutability（不可变）：所有变更返回新实例
 */

import { ValueObject } from '@dailyuse/utils';
import type { 
  ExamplePropertyDTO, 
  ExamplePropertyPersistenceDTO 
} from '@dailyuse/contracts/example';

/**
 * 【基类 ValueObject<T> 自带方法】
 * - props: T (readonly) - 内部属性，已通过 Object.freeze 冻结
 * - equals(vo?: ValueObject<T>): boolean - 结构性相等检查（使用 lodash.isEqual 深度比较）
 * - getRawProps(): T - 获取原始属性副本
 */
export class ExampleProperty extends ValueObject<ExamplePropertyDTO> {

  // ================= 构造函数（必须私有）=================
  private constructor(props: ExamplePropertyDTO) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的值对象（包含校验）
   * 
   * @param props - 属性 DTO
   * @throws 当校验失败时抛出错误
   * 
   * @example
   * ```typescript
   * const property = ExampleProperty.create({
   *   key: 'color',
   *   value: 'blue',
   *   description: '主题颜色',
   * });
   * ```
   */
  public static create(props: ExamplePropertyDTO): ExampleProperty {
    this.validate(props);
    return new ExampleProperty(props);
  }

  // ================= 工厂方法 2: 创建默认值 =================
  /**
   * 生成业务默认状态
   * 
   * 场景：创建新 Example 时，生成默认属性
   * 逻辑下沉：默认值生成规则封装在值对象内部
   * 
   * @example
   * ```typescript
   * const defaultProperty = ExampleProperty.createDefault('theme');
   * // { key: 'theme', value: '', description: null }
   * ```
   */
  public static createDefault(key: string): ExampleProperty {
    return new ExampleProperty({
      key,
      value: '',
      description: null,
    });
  }

  // ================= 工厂方法 3: 从 DTO 恢复 =================
  /**
   * 从 DTO 恢复值对象
   * 
   * 用于：从 API 响应或客户端数据还原对象
   * 注意：跳过校验（假设数据来源可信）
   * 
   * @example
   * ```typescript
   * const property = ExampleProperty.fromDTO(apiResponse.property);
   * ```
   */
  public static fromDTO(dto: ExamplePropertyDTO): ExampleProperty {
    return new ExampleProperty(dto);
  }

  // ================= 工厂方法 4: 从持久化 DTO 恢复 =================
  /**
   * 从数据库持久化 DTO 恢复值对象
   * 
   * 用于：从 Repository 加载数据时还原对象
   * 职责：将数据库格式转换为领域对象格式
   * 
   * @example
   * ```typescript
   * const property = ExampleProperty.fromPersistenceDTO(dbRow.property);
   * ```
   */
  public static fromPersistenceDTO(dto: ExamplePropertyPersistenceDTO): ExampleProperty {
    return new ExampleProperty({
      key: dto.key,
      value: dto.value,
      description: dto.description,
    });
  }

  // ================= 内部校验逻辑 =================
  /**
   * 集中校验逻辑
   * 
   * 【规范说明】
   * - 所有校验规则（Regex, 长度, 数值范围）必须写在这里
   * - 目的：保证前端表单校验和后端 API 入参校验使用同一套规则
   */
  private static validate(props: ExamplePropertyDTO): void {
    // Key 校验：必填，长度限制
    if (!props.key || props.key.trim().length === 0) {
      throw new Error('Property key cannot be empty');
    }
    if (props.key.length > 64) {
      throw new Error('Property key too long (max 64 characters)');
    }
    // Key 格式校验：只允许字母、数字、下划线
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(props.key)) {
      throw new Error('Property key must start with letter, only allow alphanumeric and underscore');
    }

    // Value 校验：长度限制
    if (props.value.length > 1024) {
      throw new Error('Property value too long (max 1024 characters)');
    }

    // Description 校验：可选，但有长度限制
    if (props.description && props.description.length > 256) {
      throw new Error('Property description too long (max 256 characters)');
    }
  }

  // ================= Getters（只读暴露）=================

  public get key(): string {
    return this.props.key;
  }

  public get value(): string {
    return this.props.value;
  }

  public get description(): string | null {
    return this.props.description;
  }

  // ================= 行为方法（不可变变更）=================
  /**
   * 更新属性值
   * 
   * 【规范说明：不可变性】
   * - 必须返回 new ExampleProperty(...)
   * - 严禁修改 this.props
   * - 变更时也必须校验
   * 
   * @example
   * ```typescript
   * const newProperty = property.updateValue('red');
   * console.log(property.value); // 'blue' (原对象不变)
   * console.log(newProperty.value); // 'red' (新对象)
   * ```
   */
  public updateValue(value: string): ExampleProperty {
    const newProps = { ...this.props, value };
    ExampleProperty.validate(newProps); // 变更时也必须校验
    return new ExampleProperty(newProps);
  }

  /**
   * 更新描述
   */
  public updateDescription(description: string | null): ExampleProperty {
    const newProps = { ...this.props, description };
    ExampleProperty.validate(newProps);
    return new ExampleProperty(newProps);
  }

  // ================= 计算属性（Rich Logic）=================

  /**
   * 是否有描述
   */
  public get hasDescription(): boolean {
    return this.props.description !== null && this.props.description.length > 0;
  }

  /**
   * 获取显示文本
   * 格式：key: value (description)
   */
  public getDisplayText(): string {
    const base = `${this.props.key}: ${this.props.value}`;
    return this.props.description ? `${base} (${this.props.description})` : base;
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 DTO（用于 API 传输或前端展示）
   * 
   * 【规范说明】
   * 返回 ClientDTO 格式，用于：
   * - API 请求/响应
   * - 前端组件 Props
   * - 日志打印
   */
  public toDTO(): ExamplePropertyDTO {
    return {
      key: this.props.key,
      value: this.props.value,
      description: this.props.description,
    };
  }

  /**
   * 转换为持久化 DTO（用于数据库存储）
   * 
   * 【规范说明：逻辑下沉】
   * 将"如何转换为数据库格式"的逻辑封装在值对象内部
   * 减轻 Server Entity 的负担
   * 
   * 职责：
   * - 将内部状态转换为数据库存储所需的格式
   * - 处理类型转换（如 Date → number）
   * - 处理结构扁平化（如嵌套对象 → JSON 字符串）
   */
  public toPersistence(): ExamplePropertyPersistenceDTO {
    return {
      key: this.props.key,
      value: this.props.value,
      description: this.props.description,
    };
  }

  // ================= 相等性判断 =================
  // ✅ 继承自基类 ValueObject.equals()，使用 lodash.isEqual 深度比较
  // 如需自定义比较逻辑，可 override equals() 方法
}

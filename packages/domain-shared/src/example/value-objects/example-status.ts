import type { ExampleStatus as IExampleStatus } from '@dailyuse/contracts/example';

/**
 * ExampleStatus 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 * 
 * 参考 docs/standards/枚举与常量对象规范(Enum&Constant-Objects).md
 * 
 * 核心原则：
 * 1. 使用 const object as const，不使用 TypeScript enum
 * 2. Key 和 Value 使用 PascalCase
 * 3. 格式：Draft: 'Draft' 一一对应
 */

/**
 * 📝 示例状态 - 示例实体的生命周期状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type ExampleStatus = IExampleStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IExampleStatus[] = ['Draft', 'Active', 'Rejected', 'Archived'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 * 没有 this，所有行为方法第一个参数都是该 Type 的实例
 */
export const ExampleStatus = {
  // ================= 常量定义 =================
  
  Draft: 'Draft' as ExampleStatus,
  Active: 'Active' as ExampleStatus,
  Rejected: 'Rejected' as ExampleStatus,
  Archived: 'Archived' as ExampleStatus,

  // ================= 工厂方法 =================

  /**
   * 🏭 工厂方法：验证并转换
   * 接受任意 string，返回安全的 ExampleStatus
   * @throws 当输入值不在合法值列表中时
   */
  of(value: string): ExampleStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ExampleStatus: ${value}`);
    }
    return value as ExampleStatus;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡️ 类型守卫：运行时类型检查
   * 用于条件判断时的类型细化
   * @example
   * if (ExampleStatus.isValid(input)) {
   *   const status: ExampleStatus = input; // TS 自动推断
   * }
   */
  isValid(value: string): value is ExampleStatus {
    return VALUES.includes(value as IExampleStatus);
  },

  /**
   * 📋 获取所有可用值
   * 用于前端渲染下拉框、状态管理等场景
   */
  getAll(): ExampleStatus[] {
    return VALUES as ExampleStatus[];
  },

  // ================= 行为方法 (State Logic) =================

  /**
   * 是否为草稿状态
   * （刚创建，还未激活）
   */
  isDraft(status: ExampleStatus): boolean {
    return status === this.Draft;
  },

  /**
   * 是否为活跃状态
   * （已发布并生效）
   */
  isActive(status: ExampleStatus): boolean {
    return status === this.Active;
  },

  /**
   * 是否为已拒绝状态
   * （创建过程中被拒绝）
   */
  isRejected(status: ExampleStatus): boolean {
    return status === this.Rejected;
  },

  /**
   * 是否为已归档状态
   * （不再使用，但保留历史数据）
   */
  isArchived(status: ExampleStatus): boolean {
    return status === this.Archived;
  },

  /**
   * 是否可编辑
   * 仅草稿状态可以编辑
   */
  isEditable(status: ExampleStatus): boolean {
    return status === this.Draft;
  },

  /**
   * 是否可激活
   * 草稿状态可以被激活
   */
  canActivate(status: ExampleStatus): boolean {
    return status === this.Draft;
  },

  /**
   * 是否可拒绝
   * 草稿状态可以被拒绝
   */
  canReject(status: ExampleStatus): boolean {
    return status === this.Draft;
  },

  /**
   * 是否可归档
   * 活跃或拒绝状态可以被归档
   */
  canArchive(status: ExampleStatus): boolean {
    return status === this.Active || status === this.Rejected;
  },

  /**
   * 状态转换校验
   * 
   * 业务规则：
   * - Draft → Active | Rejected
   * - Active → Archived
   * - Rejected → Archived
   * - Archived → （不可转换）
   */
  canTransitionTo(from: ExampleStatus, to: ExampleStatus): boolean {
    const transitions: Record<IExampleStatus, IExampleStatus[]> = {
      'Draft': ['Active', 'Rejected'],
      'Active': ['Archived'],
      'Rejected': ['Archived'],
      'Archived': [],
    };
    return transitions[from as IExampleStatus]?.includes(to as IExampleStatus) ?? false;
  },

} as const;

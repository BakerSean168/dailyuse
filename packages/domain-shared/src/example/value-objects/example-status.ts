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
 * 示例模块的生命周期状态
 * 
 * 状态机：
 * Draft → Active → Archived
 * Draft → Rejected → Archived
 */
export const ExampleStatusEnum = {
  /** 草稿状态：刚创建，还未激活 */
  Draft: 'Draft',
  /** 活跃状态：已发布并生效 */
  Active: 'Active',
  /** 已拒绝状态：创建过程中被拒绝 */
  Rejected: 'Rejected',
  /** 已归档状态：不再使用，但保留历史数据 */
  Archived: 'Archived',
} as const;

/**
 * ExampleStatus 类型
 * 结果：'Draft' | 'Active' | 'Rejected' | 'Archived'
 */
export type ExampleStatusType = typeof ExampleStatusEnum[keyof typeof ExampleStatusEnum];

/**
 * ExampleStatus 工具对象
 * 
 * 提供类型安全的枚举操作方法
 */
export const ExampleStatus = {
  ...ExampleStatusEnum,

  /**
   * 从 string 安全转换为 ExampleStatusType
   * 
   * @throws 当值不是有效状态时
   */
  of(value: string): ExampleStatusType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ExampleStatus: ${value}`);
    }
    return value as ExampleStatusType;
  },

  /**
   * 校验是否为有效状态值
   */
  isValid(value: string): value is ExampleStatusType {
    return Object.values(ExampleStatusEnum).includes(value as ExampleStatusType);
  },

  /**
   * 获取所有状态值
   */
  values(): ExampleStatusType[] {
    return Object.values(ExampleStatusEnum);
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
  canTransitionTo(from: ExampleStatusType, to: ExampleStatusType): boolean {
    const transitions: Record<ExampleStatusType, ExampleStatusType[]> = {
      [ExampleStatusEnum.Draft]: [ExampleStatusEnum.Active, ExampleStatusEnum.Rejected],
      [ExampleStatusEnum.Active]: [ExampleStatusEnum.Archived],
      [ExampleStatusEnum.Rejected]: [ExampleStatusEnum.Archived],
      [ExampleStatusEnum.Archived]: [],
    };
    return transitions[from]?.includes(to) ?? false;
  },
} as const;

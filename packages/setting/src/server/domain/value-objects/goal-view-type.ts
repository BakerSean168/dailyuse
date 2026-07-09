import { GoalViewType as GoalViewTypeContract, type GoalViewType as IGoalViewType } from '@dailyuse/contracts/setting';

/**
 * 📝 目标视图类型 - 目标的显示视图类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type GoalViewType = IGoalViewType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IGoalViewType[] = Object.values(GoalViewTypeContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const GoalViewType = {
  // ================= 常量定义 =================
  
  List: 'List' as GoalViewType,
  Tree: 'Tree' as GoalViewType,
  Timeline: 'Timeline' as GoalViewType,

  // ================= 工厂方法 =================

  of(value: string): GoalViewType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid GoalViewType: ${value}`);
    }
    return value as GoalViewType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is GoalViewType {
    return VALUES.includes(value as IGoalViewType);
  },

  // ================= 遍历方法 =================

  getAll(): GoalViewType[] {
    return VALUES as GoalViewType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为列表视图
   */
  isList(value: GoalViewType): boolean {
    return value === 'List';
  },

  /**
   * 判断是否为树形视图
   */
  isTree(value: GoalViewType): boolean {
    return value === 'Tree';
  },

  /**
   * 判断是否为时间线视图
   */
  isTimeline(value: GoalViewType): boolean {
    return value === 'Timeline';
  },
};

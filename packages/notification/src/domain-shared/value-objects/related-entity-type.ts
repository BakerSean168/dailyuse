import type { RelatedEntityType as IRelatedEntityType } from '@dailyuse/contracts/notification';

/**
 * 📝 关联实体类型 - 通知关联的业务实体类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type RelatedEntityType = IRelatedEntityType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IRelatedEntityType[] = ['Task', 'Goal', 'Schedule', 'Reminder'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const RelatedEntityType = {
  // ================= 常量定义 =================
  
  Task: 'Task' as RelatedEntityType,
  Goal: 'Goal' as RelatedEntityType,
  Schedule: 'Schedule' as RelatedEntityType,
  Reminder: 'Reminder' as RelatedEntityType,

  // ================= 工厂方法 =================

  of(value: string): RelatedEntityType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid RelatedEntityType: ${value}`);
    }
    return value as RelatedEntityType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is RelatedEntityType {
    return VALUES.includes(value as IRelatedEntityType);
  },

  // ================= 遍历方法 =================

  getAll(): RelatedEntityType[] {
    return VALUES as RelatedEntityType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为时间相关实体（Schedule 和 Reminder）
   */
  isTimeRelated(value: RelatedEntityType): boolean {
    return value === 'Schedule' || value === 'Reminder';
  },

  /**
   * 判断是否为目标相关实体
   */
  isGoalRelated(value: RelatedEntityType): boolean {
    return value === 'Goal';
  },
};

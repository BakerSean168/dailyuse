import type { SyncableEntityType as ISyncableEntityType } from '@dailyuse/contracts/sync';

/**
 * 📝 可同步实体类型 - 可被同步的实体类型
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type SyncableEntityType = ISyncableEntityType & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: ISyncableEntityType[] = ['Goal', 'KeyResult', 'GoalRecord', 'GoalReview', 'Task', 'Schedule', 'Reminder', 'Settings'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const SyncableEntityType = {
  // ================= 常量定义 =================
  
  Goal: 'Goal' as SyncableEntityType,
  KeyResult: 'KeyResult' as SyncableEntityType,
  GoalRecord: 'GoalRecord' as SyncableEntityType,
  GoalReview: 'GoalReview' as SyncableEntityType,
  Task: 'Task' as SyncableEntityType,
  Schedule: 'Schedule' as SyncableEntityType,
  Reminder: 'Reminder' as SyncableEntityType,
  Settings: 'Settings' as SyncableEntityType,

  // ================= 工厂方法 =================

  of(value: string): SyncableEntityType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid SyncableEntityType: ${value}`);
    }
    return value as SyncableEntityType;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is SyncableEntityType {
    return VALUES.includes(value as ISyncableEntityType);
  },

  // ================= 遍历方法 =================

  getAll(): SyncableEntityType[] {
    return VALUES as SyncableEntityType[];
  },

  // ================= 工具方法 =================

  /**
   * 判断是否为目标相关实体
   */
  isGoalRelated(value: SyncableEntityType): boolean {
    return value === 'Goal' || value === 'KeyResult' || value === 'GoalRecord' || value === 'GoalReview';
  },

  /**
   * 判断是否为任务相关实体
   */
  isTaskRelated(value: SyncableEntityType): boolean {
    return value === 'Task';
  },

  /**
   * 判断是否为时间相关实体（日程、提醒）
   */
  isTimeRelated(value: SyncableEntityType): boolean {
    return value === 'Schedule' || value === 'Reminder';
  },

  /**
   * 判断是否为设置
   */
  isSettings(value: SyncableEntityType): boolean {
    return value === 'Settings';
  },

  /**
   * 判断是否为业务数据（非设置）
   */
  isBusinessData(value: SyncableEntityType): boolean {
    return value !== 'Settings';
  },
};

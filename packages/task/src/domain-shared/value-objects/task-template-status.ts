import type { TaskTemplateStatus as ITaskTemplateStatus } from '@dailyuse/contracts/task';

/**
 * 📝 任务模板状态 - 任务模板的生命周期状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type TaskTemplateStatus = ITaskTemplateStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: ITaskTemplateStatus[] = ['Active', 'Paused', 'Archived', 'Deleted'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const TaskTemplateStatus = {
  // ================= 常量定义 =================
  
  Active: 'Active' as TaskTemplateStatus,
  Paused: 'Paused' as TaskTemplateStatus,
  Archived: 'Archived' as TaskTemplateStatus,
  Deleted: 'Deleted' as TaskTemplateStatus,

  // ================= 工厂方法 =================

  of(value: string): TaskTemplateStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid TaskTemplateStatus: ${value}`);
    }
    return value as TaskTemplateStatus;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is TaskTemplateStatus {
    return VALUES.includes(value as ITaskTemplateStatus);
  },

  // ================= 遍历方法 =================

  getAll(): TaskTemplateStatus[] {
    return VALUES as TaskTemplateStatus[];
  },

  // ================= 工具方法 =================

  /**
   * 判断模板是否活跃
   */
  isActive(value: TaskTemplateStatus): boolean {
    return value === 'Active';
  },

  /**
   * 判断模板是否暂停
   */
  isPaused(value: TaskTemplateStatus): boolean {
    return value === 'Paused';
  },

  /**
   * 判断模板是否已归档
   */
  isArchived(value: TaskTemplateStatus): boolean {
    return value === 'Archived';
  },

  /**
   * 判断模板是否已删除
   */
  isDeleted(value: TaskTemplateStatus): boolean {
    return value === 'Deleted';
  },

  /**
   * 判断模板是否可用（活跃或已归档）
   */
  isAvailable(value: TaskTemplateStatus): boolean {
    return value === 'Active' || value === 'Archived';
  },

  /**
   * 判断模板是否可执行（活跃）
   */
  isExecutable(value: TaskTemplateStatus): boolean {
    return value === 'Active';
  },
};

import { TaskInstanceStatus as TaskInstanceStatusContract, type TaskInstanceStatus as ITaskInstanceStatus } from '@dailyuse/contracts/task';

/**
 * 📝 任务实例状态 - 循环任务实例的生命周期状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type TaskInstanceStatus = ITaskInstanceStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: ITaskInstanceStatus[] = Object.values(TaskInstanceStatusContract);

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const TaskInstanceStatus = {
  // ================= 常量定义 =================
  
  Pending: 'Pending' as TaskInstanceStatus,
  InProgress: 'InProgress' as TaskInstanceStatus,
  Completed: 'Completed' as TaskInstanceStatus,
  Skipped: 'Skipped' as TaskInstanceStatus,
  Expired: 'Expired' as TaskInstanceStatus,

  // ================= 工厂方法 =================

  of(value: string): TaskInstanceStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid TaskInstanceStatus: ${value}`);
    }
    return value as TaskInstanceStatus;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is TaskInstanceStatus {
    return VALUES.includes(value as ITaskInstanceStatus);
  },

  // ================= 遍历方法 =================

  getAll(): TaskInstanceStatus[] {
    return VALUES as TaskInstanceStatus[];
  },

  // ================= 工具方法 =================

  /**
   * 判断任务实例是否待处理
   */
  isPending(value: TaskInstanceStatus): boolean {
    return value === 'Pending';
  },

  /**
   * 判断任务实例是否进行中
   */
  isInProgress(value: TaskInstanceStatus): boolean {
    return value === 'InProgress';
  },

  /**
   * 判断任务实例是否已完成
   */
  isCompleted(value: TaskInstanceStatus): boolean {
    return value === 'Completed';
  },

  /**
   * 判断任务实例是否已跳过
   */
  isSkipped(value: TaskInstanceStatus): boolean {
    return value === 'Skipped';
  },

  /**
   * 判断任务实例是否已过期
   */
  isExpired(value: TaskInstanceStatus): boolean {
    return value === 'Expired';
  },

  /**
   * 判断任务实例是否已终止（完成、跳过或过期）
   */
  isTerminated(value: TaskInstanceStatus): boolean {
    return value === 'Completed' || value === 'Skipped' || value === 'Expired';
  },

  /**
   * 判断任务实例是否需要处理（未完成且未过期）
   */
  needsAction(value: TaskInstanceStatus): boolean {
    return value === 'Pending' || value === 'InProgress';
  },
};

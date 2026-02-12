import type { TaskStatus as ITaskStatus } from '@dailyuse/contracts/ai';

/**
 * TaskStatus 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 */

export type TaskStatus = ITaskStatus & { readonly __brand: unique symbol };

const VALUES: ITaskStatus[] = ['Pending', 'Processing', 'Completed', 'Failed'];

export const TaskStatus = {
  Pending: 'Pending' as TaskStatus,
  Processing: 'Processing' as TaskStatus,
  Completed: 'Completed' as TaskStatus,
  Failed: 'Failed' as TaskStatus,

  of(value: string): TaskStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid TaskStatus: ${value}`);
    }
    return value as TaskStatus;
  },

  isValid(value: string): value is TaskStatus {
    return VALUES.includes(value as ITaskStatus);
  },

  getAll(): TaskStatus[] {
    return VALUES as TaskStatus[];
  },

  isPending(status: TaskStatus): boolean {
    return status === this.Pending;
  },

  isProcessing(status: TaskStatus): boolean {
    return status === this.Processing;
  },

  isCompleted(status: TaskStatus): boolean {
    return status === this.Completed;
  },

  isFailed(status: TaskStatus): boolean {
    return status === this.Failed;
  },

  isTerminated(status: TaskStatus): boolean {
    return this.isCompleted(status) || this.isFailed(status);
  },
};

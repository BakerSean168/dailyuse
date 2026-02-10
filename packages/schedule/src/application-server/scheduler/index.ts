/**
 * Schedule Scheduler Module
 *
 * 优先队列调度器及相关组件
 *
 * @module application-server/schedule/scheduler
 */

// 从 patterns 包导出通用框架
export type { IScheduleTimer } from '@dailyuse/patterns/scheduler';
export { NodeTimer, FakeTimer } from '@dailyuse/patterns/scheduler';

export type { HeapItem } from '@dailyuse/patterns/scheduler';
export { MinHeap } from '@dailyuse/patterns/scheduler';

export type {
  IScheduleMonitor,
  ScheduleExecutionStats,
  ScheduleExecutionRecord,
} from '@dailyuse/patterns/scheduler';
export { NoopScheduleMonitor, InMemoryScheduleMonitor } from '@dailyuse/patterns/scheduler';

// 优先队列调度器
export type {
  ScheduleTaskQueueConfig,
  ScheduleTaskQueueStatus,
  ScheduledItem,
  IScheduleTaskLoader,
  IScheduleLogger,
  MissedTasksResult,
} from './ScheduleTaskQueue';
export { ScheduleTaskQueue, ConsoleScheduleLogger } from './ScheduleTaskQueue';

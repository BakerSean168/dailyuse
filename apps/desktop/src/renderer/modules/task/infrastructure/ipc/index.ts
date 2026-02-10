/**
 * Task IPC Module - Barrel Exports
 *
 * 从 @dailyuse/infrastructure-client 重导出 IPC Adapters
 */

export {
  TaskTemplateIpcAdapter,
  TaskInstanceIpcAdapter,
  TaskDependencyIpcAdapter,
  TaskStatisticsIpcAdapter,
  createTaskTemplateIpcAdapter,
  createTaskInstanceIpcAdapter,
  createTaskDependencyIpcAdapter,
  createTaskStatisticsIpcAdapter,
} from '@dailyuse/task/infrastructure-client';

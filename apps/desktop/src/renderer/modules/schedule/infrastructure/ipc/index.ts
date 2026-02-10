/**
 * Schedule IPC Module - Barrel Exports
 *
 * 从 @dailyuse/infrastructure-client 重导出 IPC Adapters
 */

export {
  ScheduleTaskIpcAdapter,
  ScheduleEventIpcAdapter,
  createScheduleTaskIpcAdapter,
  createScheduleEventIpcAdapter,
} from '@dailyuse/schedule/infrastructure-client';

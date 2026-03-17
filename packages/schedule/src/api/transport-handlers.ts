/**
 * Schedule transport handler mapping.
 * 调度模块传输层处理器映射。
 *
 * This file converts the module facade into the function signatures required by
 * controllers. It is shared by HTTP and Electron transports so the mapping is
 * defined once.
 *
 * 这个文件把模块门面转换成控制器所需的函数签名。
 * HTTP 和 Electron 共用这一层，避免重复定义同样的 handler 映射。
 */

import type { ScheduleUseCases } from '../controllers/schedule.controller';
import type { ScheduleEventUseCases } from '../controllers/schedule-event.controller';
import type { ScheduleApplicationPort } from '../infrastructure-server';
import type { ScheduleEventApplicationPort } from '../infrastructure-server';

/**
 * Creates transport handlers from the application port.
 * 从应用层端口创建传输层处理器。
 *
 * The ScheduleApplicationPort and ScheduleUseCases have the same shape,
 * so this is a direct pass-through.
 * ScheduleApplicationPort 和 ScheduleUseCases 形状一致，直接透传即可。
 */
export function createScheduleTransportHandlers(api: ScheduleApplicationPort): ScheduleUseCases {
  return api;
}

export function createScheduleEventTransportHandlers(
  api: ScheduleEventApplicationPort,
): ScheduleEventUseCases {
  return api;
}

/**
 * Reminder transport handler mapping.
 * 提醒模块传输层处理器映射。
 *
 * This file converts the module facade into the function signatures required by
 * controllers. It is shared by HTTP and Electron transports so the mapping is
 * defined once.
 *
 * 这个文件把模块门面转换成控制器所需的函数签名。
 * HTTP 和 Electron 共用这一层，避免重复定义同样的 handler 映射。
 */

import type { ReminderUseCases } from '../controllers/reminder.controller';
import type { ReminderApplicationPort } from '../infrastructure-server';

/**
 * Creates transport handlers from the application port.
 * 从应用端口创建传输层处理器。
 *
 * The ReminderApplicationPort already satisfies the ReminderUseCases interface,
 * so this mapping is a direct pass-through.
 *
 * ReminderApplicationPort 已经满足 ReminderUseCases 接口，
 * 因此这个映射是直接透传。
 */
export function createReminderTransportHandlers(api: ReminderApplicationPort): ReminderUseCases {
  return api;
}

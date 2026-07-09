/**
 * NotificationHistory Entity - Server Interface
 * 通知历史实体 - 服务端接口
 */

import type { NotificationHistoryId, NotificationId, TransferDate } from '../../../primitives';

// ============ DTO 定义 ============

/**
 * NotificationHistory Server DTO
 */
export interface NotificationHistoryServerDTO {
  id: NotificationHistoryId;
  notificationId: NotificationId;
  action: string;
  details: unknown | null;
  createdAt: TransferDate;
}

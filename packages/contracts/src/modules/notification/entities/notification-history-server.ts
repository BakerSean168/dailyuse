/**
 * NotificationHistory Entity - Server Interface
 * 通知历史实体 - 服务端接口
 */

// ============ DTO 定义 ============

/**
 * NotificationHistory Server DTO
 */
export interface NotificationHistoryServerDTO {
  uuid: string;
  notificationUuid: string;
  action: string; // 'CREATED' | 'SENT' | 'READ' | 'DELETED' | etc.
  details?: any | null;
  createdAt: number; // epoch ms
}

/**
 * NotificationHistory Persistence DTO (数据库映射)
 */
export interface NotificationHistoryPersistenceDTO {
  uuid: string;
  notificationUuid: string;
  action: string;
  details?: string | null; // JSON string
  createdAt: Date;
}

// ============ 实体接口 ============

/**
 * NotificationHistory 实体 - Server 接口
 */
export interface NotificationHistoryServer {
  // 基础属性
  uuid: string;
  notificationUuid: string;
  action: string;
  details?: any | null;

  // 时间戳 (统一使用 number epoch ms)
  createdAt: Date;

  // ===== 业务方法 =====

  // 查询

  // ===== 转换方法 (To) =====
  /**
   * 转换为 Persistence DTO (数据库)
   */}

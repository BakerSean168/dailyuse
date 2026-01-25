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
  getNotification(): Promise<any>; // 返回 NotificationServer，避免循环依赖

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): NotificationHistoryServerDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): NotificationHistoryPersistenceDTO;
}

/**
 * NotificationHistory 静态工厂方法接口
 */
export interface NotificationHistoryServerStatic {
  /**
   * 创建新的 NotificationHistory 实体（静态工厂方法）
   */
  create(params: {
    notificationUuid: string;
    action: string;
    details?: any;
  }): NotificationHistoryServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: NotificationHistoryServerDTO): NotificationHistoryServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: NotificationHistoryPersistenceDTO): NotificationHistoryServer;
}

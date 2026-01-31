/**
 * NotificationMetadata Value Object
 * 通知元数据值对象
 */

// ============ 接口定义 ============

/**
 * NotificationMetadata Server Interface
 */
export interface INotificationMetadata {
  icon: string | null;
  image: string | null;
  color: string | null;
  sound: string | null;
  badge: number | null;
  data?: any; // 自定义数据

  // 值对象方法
  with(
    updates: Partial<
      Omit<
        INotificationMetadata,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationMetadata;

  // DTO 转换方法
}

/**
 * NotificationMetadata Client Interface
 */
export interface INotificationMetadataClient {
  icon: string | null;
  image: string | null;
  color: string | null;
  sound: string | null;
  badge: number | null;
  data?: any;

  // UI 计算属性
  hasIcon: boolean;
  hasImage: boolean;
  hasBadge: boolean;

  // 值对象方法

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * NotificationMetadata DTO (Server)
 */
export interface NotificationMetadataDTO {
  icon: string | null;
  image: string | null;
  color: string | null;
  sound: string | null;
  badge: number | null;
  data?: any;
}

/**
 * NotificationMetadata Client DTO
 */
export interface NotificationMetadataClientDTO {
  icon: string | null;
  image: string | null;
  color: string | null;
  sound: string | null;
  badge: number | null;
  data?: any;
  hasIcon: boolean;
  hasImage: boolean;
  hasBadge: boolean;
}

/**
 * NotificationMetadata Persistence DTO
 */
export interface NotificationMetadataPersistenceDTO {
  icon: string | null;
  image: string | null;
  color: string | null;
  sound: string | null;
  badge: number | null;
  data: string | null; // JSON string
}

// ============ 实现类型 ============

export type NotificationMetadata = INotificationMetadata;
export type NotificationMetadataClient = INotificationMetadataClient;

// ============ Backward Compatibility ============

/**
 * @deprecated Use NotificationMetadataDTO instead
 */
export type NotificationMetadataServerDTO = NotificationMetadataDTO;

/**
 * @deprecated Use INotificationMetadata instead
 */
export type INotificationMetadataServer = INotificationMetadata;

/**
 * @deprecated Use NotificationMetadata instead
 */
export type NotificationMetadataServer = NotificationMetadata;

/**
 * NotificationMetadata Value Object
 * 通知元数据值对象
 */

// ============ 接口定义 ============

/**
 * NotificationMetadata Server Interface
 */
export interface NotificationMetadata {
  icon: string | null;
  image: string | null;
  color: string | null;
  sound: string | null;
  badge: number | null;
  data?: unknown;

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
  data?: unknown;
}


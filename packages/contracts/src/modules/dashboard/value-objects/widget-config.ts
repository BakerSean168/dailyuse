/**
 * Widget 配置值对象
 * Widget Configuration Value Object
 */
import type { WidgetSize } from './widget-size';

// ============ DTO 定义 ============

/**
 * Widget 配置 DTO (Client & Server 共用)
 */
export interface WidgetConfigDTO {
  visible: boolean;
  order: number;
  size: WidgetSize;
}

// ============ Client 接口 ============

/**
 * Widget 配置值对象 - Client
 */
export interface WidgetConfigClient {
  visible: boolean;
  order: number;
  size: WidgetSize;

  /**
   * 克隆配置
   */

  /**
   * 是否与另一个配置相等
   */
}

// ============ Server 接口 ============

/**
 * Widget 配置值对象 - Server
 */
export interface WidgetConfigServer {
  visible: boolean;
  order: number;
  size: WidgetSize;

  /**
   * 验证配置有效性
   */

  /**
   * 是否与另一个配置相等
   */
}

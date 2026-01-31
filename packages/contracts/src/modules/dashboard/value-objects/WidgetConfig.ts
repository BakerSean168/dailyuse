/**
 * Widget 配置值对象
 * Widget Configuration Value Object
 */
import type { WidgetSize } from '../enums';

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
  toDTO(): WidgetConfigDTO;

  /**
   * 克隆配置
   */
  clone(): WidgetConfigClient;

  /**
   * 是否与另一个配置相等
   */
  equals(other: WidgetConfigClient): boolean;
}

// ============ Server 接口 ============

/**
 * Widget 配置值对象 - Server
 */
export interface WidgetConfigServer {
  visible: boolean;
  order: number;
  size: WidgetSize;
  toDTO(): WidgetConfigDTO;

  /**
   * 验证配置有效性
   */
  validate(): boolean;

  /**
   * 是否与另一个配置相等
   */
  equals(other: WidgetConfigServer): boolean;
}

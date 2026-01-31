/**
 * DashboardConfig Aggregate Root - Client Interface
 * Dashboard 配置聚合根 - 客户端接口
 */
import type { WidgetConfigDTO } from '../value-objects/WidgetConfig';
import type { WidgetConfigData } from './DashboardConfigServer';

// ============ DTO 定义 ============

/**
 * DashboardConfig Client DTO
 */
export interface DashboardConfigClientDTO {
  uuid: string;
  accountUuid: string;
  widgetConfig: WidgetConfigData;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms

  // UI 计算字段
  visibleWidgetIds: string[]; // 可见的 Widget ID 列表（按 order 排序）
  widgetCount: number; // Widget 总数
  visibleWidgetCount: number; // 可见的 Widget 数量
}

// ============ 实体接口 ============

/**
 * DashboardConfig 聚合根 - Client 接口（实例方法）
 */
export interface DashboardConfigClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  widgetConfig: WidgetConfigData;
  createdAt: Date;
  updatedAt: Date;

  // ===== 计算属性 =====

  /**
   * 获取可见的 Widget ID 列表（按 order 排序）
   */
  getVisibleWidgetIds(): string[];

  /**
   * 获取 Widget 总数
   */
  getWidgetCount(): number;

  /**
   * 获取可见的 Widget 数量
   */
  getVisibleWidgetCount(): number;

  /**
   * 获取指定 Widget 的配置
   */
  getWidgetConfig(widgetId: string): WidgetConfigDTO | null;

  /**
   * 检查 Widget 是否可见
   */
  isWidgetVisible(widgetId: string): boolean;

  // ===== 业务方法 =====

  /**
   * 更新 Widget 配置（部分更新）
   */
  updateWidgetConfig(updates: Partial<WidgetConfigData>): DashboardConfigClient;

  /**
   * 显示 Widget
   */
  showWidget(widgetId: string): DashboardConfigClient;

  /**
   * 隐藏 Widget
   */
  hideWidget(widgetId: string): DashboardConfigClient;

  /**
   * 重新排序 Widget
   */
  reorderWidget(widgetId: string, newOrder: number): DashboardConfigClient;

  /**
   * 调整 Widget 尺寸
   */
  resizeWidget(widgetId: string, size: WidgetConfigDTO['size']): DashboardConfigClient;

  /**
   * 重置为默认配置
   */
  resetToDefault(): DashboardConfigClient;

}

// ============ 静态工厂方法 ============

/**
 * DashboardConfig Client 工厂接口
 */
export interface DashboardConfigClientFactory {
  /**
   * 从 DTO 创建实例
   */
  fromDTO(dto: DashboardConfigClientDTO): DashboardConfigClient;

  /**
   * 从 Server DTO 创建实例
   */
  fromServerDTO(dto: any): DashboardConfigClient;

  /**
   * 创建默认配置
   */
  createDefault(accountUuid: string): DashboardConfigClient;
}

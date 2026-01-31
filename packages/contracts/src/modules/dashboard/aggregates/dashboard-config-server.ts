/**
 * DashboardConfig Aggregate Root - Server Interface
 * Dashboard 配置聚合根 - 服务端接口
 */
import type { DashboardId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { WidgetConfigDTO } from '../value-objects/widget-config';

// ============ DTO 定义 ============

/**
 * Widget 配置数据类型
 * Key: Widget ID (如 'task-stats', 'goal-stats')
 * Value: Widget 配置
 */
export type WidgetConfigData = Record<string, WidgetConfigDTO>;

/**
 * DashboardConfig Server DTO
 */
export interface DashboardConfigServerDTO {
  id: DashboardId;
  identityId: IdentityId;
  widgetConfig: WidgetConfigData;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * DashboardConfig Persistence DTO (数据库映射)
 */
export interface DashboardConfigPersistenceDTO {
  id: number;
  identityId: IdentityId;
  widgetConfig: string; // JSON string
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ 实体接口 ============

/**
 * DashboardConfig 聚合根 - Server 接口（实例方法）
 */
export interface DashboardConfigServer {
  // 基础属性
  id: DashboardId;
  identityId: IdentityId;
  widgetConfig: WidgetConfigData;
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // ===== 查询方法 =====

  /**
   * 获取指定 Widget 的配置
   */
  getWidgetConfig(widgetId: string): WidgetConfigDTO | null;

  /**
   * 检查 Widget 是否存在
   */
  hasWidget(widgetId: string): boolean;

  /**
   * 获取所有 Widget ID
   */
  getWidgetIds(): string[];

  /**
   * 获取可见的 Widget ID 列表（按 order 排序）
   */
  getVisibleWidgetIds(): string[];

  // ===== 业务方法 =====

  /**
   * 更新 Widget 配置（部分更新，合并策略）
   */
  updateWidgetConfig(updates: Partial<WidgetConfigData>): void;

  /**
   * 替换整个 Widget 配置
   */
  replaceWidgetConfig(widgetConfig: WidgetConfigData): void;

  /**
   * 显示 Widget
   */
  showWidget(widgetId: string): void;

  /**
   * 隐藏 Widget
   */
  hideWidget(widgetId: string): void;

  /**
   * 重新排序 Widget
   */
  reorderWidget(widgetId: string, newOrder: number): void;

  /**
   * 调整 Widget 尺寸
   */
  resizeWidget(widgetId: string, size: WidgetConfigDTO['size']): void;

  /**
   * 重置为默认配置
   */
  resetToDefault(): void;

  // ===== 验证方法 =====

  /**
   * 验证配置有效性
   */
  validate(): boolean;

  /**
   * 验证 Widget 配置
   */
  validateWidgetConfig(widgetId: string): boolean;

}

// ============ 静态工厂方法 ============

/**
 * DashboardConfig Server 工厂接口
 */
export interface DashboardConfigServerFactory {
  /**
   * 从 DTO 创建实例
   */
  fromDTO(dto: DashboardConfigServerDTO): DashboardConfigServer;

  /**
   * 从 Persistence DTO 创建实例
   */
  fromPersistence(dto: DashboardConfigPersistenceDTO): DashboardConfigServer;

  /**
   * 创建新配置（使用默认值）
   */
  create(identityId: string, widgetConfig?: WidgetConfigData): DashboardConfigServer;

  /**
   * 创建默认配置
   */
  createDefault(identityId: string): DashboardConfigServer;
}

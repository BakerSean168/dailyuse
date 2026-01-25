/**
 * DashboardConfig 聚合根实现
 * 实现 DashboardConfigServer 接口
 *
 * DDD 聚合根职责：
 * - 管理用户的 Widget 配置
 * - 执行配置相关的业务逻辑
 * - 确保配置的一致性
 */

import { AggregateRoot } from '@dailyuse/utils';
import {
  WidgetSize,
} from '@dailyuse/contracts/dashboard';
import type {
  DashboardConfigPersistenceDTO,
  DashboardConfigServer,
  DashboardConfigServerDTO,
  WidgetConfigDTO,
  WidgetConfigData,
} from '@dailyuse/contracts/dashboard';
import { WidgetConfig } from '../value-objects';

// 类型别名

/**
 * 默认 Widget 配置
 */
const DEFAULT_WIDGET_CONFIG: WidgetConfigData = {
  'task-stats': { visible: true, order: 1, size: WidgetSize.MEDIUM },
  'goal-stats': { visible: true, order: 2, size: WidgetSize.MEDIUM },
  'reminder-stats': { visible: true, order: 3, size: WidgetSize.SMALL },
  'schedule-stats': { visible: true, order: 4, size: WidgetSize.SMALL },
  'today-tasks': { visible: true, order: 5, size: WidgetSize.MEDIUM },
  'goal-timeline': { visible: true, order: 6, size: WidgetSize.LARGE },
};

/**
 * DashboardConfig 聚合根
 */
export class DashboardConfig extends AggregateRoot implements DashboardConfigServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _widgetConfig: Map<string, WidgetConfig>;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    widgetConfig: WidgetConfigData;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? `dashboard-config-${params.accountUuid}`);
    this._accountUuid = params.accountUuid;
    this._widgetConfig = new Map();
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;

    // 初始化 Widget 配置
    Object.entries(params.widgetConfig).forEach(([widgetId, config]) => {
      this._widgetConfig.set(widgetId, WidgetConfig.fromDTO(config));
    });
  }

  // ===== 静态工厂方法 =====

  /**
   * 从 DTO 创建实例
   */
  static fromDTO(dto: DashboardConfigServerDTO): DashboardConfig {
    return new DashboardConfig({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      widgetConfig: dto.widgetConfig,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 从 Persistence DTO 创建实例
   */
  static fromPersistence(dto: DashboardConfigPersistenceDTO): DashboardConfig {
    const widgetConfig = JSON.parse(dto.widgetConfig) as WidgetConfigData;

    return new DashboardConfig({
      uuid: `dashboard-config-${dto.accountUuid}`, // 生成 UUID
      accountUuid: dto.accountUuid,
      widgetConfig,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 创建新配置
   */
  static create(accountUuid: string, widgetConfig?: WidgetConfigData): DashboardConfig {
    const now = Date.now();

    return new DashboardConfig({
      accountUuid,
      widgetConfig: widgetConfig || DEFAULT_WIDGET_CONFIG,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 创建默认配置
   */
  static createDefault(accountUuid: string): DashboardConfig {
    return DashboardConfig.create(accountUuid, DEFAULT_WIDGET_CONFIG);
  }

  // ===== Getter 属性 =====

  override get uuid(): string {
    return this._uuid;
  }

  get accountUuid(): string {
    return this._accountUuid;
  }

  get widgetConfig(): WidgetConfigData {
    const config: WidgetConfigData = {};
    this._widgetConfig.forEach((value, key) => {
      config[key] = value.toDTO();
    });
    return config;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  // ===== 查询方法 =====

  /**
   * 获取指定 Widget 的配置
   */
  getWidgetConfig(widgetId: string): WidgetConfigDTO | null {
    const config = this._widgetConfig.get(widgetId);
    return config ? config.toDTO() : null;
  }

  /**
   * 检查 Widget 是否存在
   */
  hasWidget(widgetId: string): boolean {
    return this._widgetConfig.has(widgetId);
  }

  /**
   * 获取所有 Widget ID
   */
  getWidgetIds(): string[] {
    return Array.from(this._widgetConfig.keys());
  }

  /**
   * 获取可见的 Widget ID 列表（按 order 排序）
   */
  getVisibleWidgetIds(): string[] {
    return Array.from(this._widgetConfig.entries())
      .filter(([_, config]) => config.visible)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([widgetId]) => widgetId);
  }

  // ===== 业务方法 =====

  /**
   * 更新 Widget 配置（部分更新，合并策略）
   */
  updateWidgetConfig(updates: Partial<WidgetConfigData>): void {
    Object.entries(updates).forEach(([widgetId, updateConfig]) => {
      if (!updateConfig) return; // 跳过 undefined

      const currentConfig = this._widgetConfig.get(widgetId);

      if (!currentConfig) {
        // Widget 不存在，创建新配置
        this._widgetConfig.set(
          widgetId,
          WidgetConfig.fromDTO({
            visible: updateConfig.visible ?? true,
            order: updateConfig.order ?? this._widgetConfig.size + 1,
            size: updateConfig.size ?? WidgetSize.MEDIUM,
          }),
        );
      } else {
        // Widget 存在，合并更新
        const newConfig = WidgetConfig.fromDTO({
          visible: updateConfig.visible ?? currentConfig.visible,
          order: updateConfig.order ?? currentConfig.order,
          size: updateConfig.size ?? currentConfig.size,
        });
        this._widgetConfig.set(widgetId, newConfig);
      }
    });

    this._updatedAt = new Date();
  }

  /**
   * 替换整个 Widget 配置
   */
  replaceWidgetConfig(widgetConfig: WidgetConfigData): void {
    this._widgetConfig.clear();
    Object.entries(widgetConfig).forEach(([widgetId, config]) => {
      this._widgetConfig.set(widgetId, WidgetConfig.fromDTO(config));
    });
    this._updatedAt = new Date();
  }

  /**
   * 显示 Widget
   */
  showWidget(widgetId: string): void {
    const config = this._widgetConfig.get(widgetId);
    if (config) {
      this._widgetConfig.set(widgetId, config.withVisible(true));
      this._updatedAt = new Date();
    }
  }

  /**
   * 隐藏 Widget
   */
  hideWidget(widgetId: string): void {
    const config = this._widgetConfig.get(widgetId);
    if (config) {
      this._widgetConfig.set(widgetId, config.withVisible(false));
      this._updatedAt = new Date();
    }
  }

  /**
   * 重新排序 Widget
   */
  reorderWidget(widgetId: string, newOrder: number): void {
    const config = this._widgetConfig.get(widgetId);
    if (config) {
      this._widgetConfig.set(widgetId, config.withOrder(newOrder));
      this._updatedAt = new Date();
    }
  }

  /**
   * 调整 Widget 尺寸
   */
  resizeWidget(widgetId: string, size: WidgetSize): void {
    const config = this._widgetConfig.get(widgetId);
    if (config) {
      this._widgetConfig.set(widgetId, config.withSize(size));
      this._updatedAt = new Date();
    }
  }

  /**
   * 重置为默认配置
   */
  resetToDefault(): void {
    this.replaceWidgetConfig(DEFAULT_WIDGET_CONFIG);
  }

  // ===== 验证方法 =====

  /**
   * 验证配置有效性
   */
  validate(): boolean {
    // 检查账户 UUID
    if (!this._accountUuid || this._accountUuid.trim() === '') {
      return false;
    }

    // 检查所有 Widget 配置
    for (const config of this._widgetConfig.values()) {
      if (!config.validate()) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证 Widget 配置
   */
  validateWidgetConfig(widgetId: string): boolean {
    const config = this._widgetConfig.get(widgetId);
    return config ? config.validate() : false;
  }

  // ===== 转换方法 =====

  /**
   * 转换为 DTO
   */
  toDTO(): DashboardConfigServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      widgetConfig: this.widgetConfig,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  toPersistence(): DashboardConfigPersistenceDTO {
    return {
      id: 0, // ID 由数据库自动生成
      accountUuid: this._accountUuid,
      widgetConfig: JSON.stringify(this.widgetConfig),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 克隆实例
   */
  clone(): DashboardConfig {
    return DashboardConfig.fromDTO(this.toDTO());
  }
}

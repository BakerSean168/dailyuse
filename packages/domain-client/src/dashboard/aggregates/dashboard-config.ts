/**
 * DashboardConfig Aggregate Root - Domain Client
 * 仪表盘配置聚合根 - 领域客户端
 *
 * 管理客户端仪表盘配置和小部件布局
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  DashboardId as IDashboardId,
  IdentityId,
  WidgetId,
} from '@dailyuse/contracts/primitives';

// ===== Local Interfaces (Client-side only) =====

/**
 * 小部件配置接口
 */
export interface WidgetConfig {
  id: WidgetId;
  type: string;
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

/**
 * 布局配置接口
 */
export interface LayoutConfig {
  columns: number;
  rowHeight: number;
  gap: number;
}

/**
 * 仪表盘配置 DTO
 */
export interface DashboardConfigDTO {
  id: string;
  identityId: string;
  name: string;
  widgets: string; // JSON string of WidgetConfig[]
  layout: string; // JSON string of LayoutConfig
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * 仪表盘配置 Client 接口
 */
export interface DashboardConfigClient {
  readonly id: IDashboardId;
  readonly identityId: IdentityId;
  readonly name: string;
  readonly widgets: readonly WidgetConfig[];
  readonly layout: LayoutConfig;
  readonly isDefault: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ===== Value Object for DashboardId =====

class DashboardId {
  private readonly _value: IDashboardId;

  private constructor(value: string) {
    this._value = value as IDashboardId;
  }

  public static of(value: string): DashboardId {
    return new DashboardId(value);
  }

  public get value(): IDashboardId {
    return this._value;
  }

  public toString(): string {
    return this._value;
  }
}

// ===== Aggregate Root =====

export class DashboardConfig
  extends AggregateRoot<IDashboardId>
  implements DashboardConfigClient
{
  private _identityId: IdentityId;
  private _name: string;
  private _widgets: WidgetConfig[];
  private _layout: LayoutConfig;
  private _isDefault: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(params: {
    id: string;
    identityId: string;
    name: string;
    widgets: WidgetConfig[];
    layout: LayoutConfig;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(DashboardId.of(params.id).value);
    this._identityId = params.identityId as IdentityId;
    this._name = params.name;
    this._widgets = params.widgets;
    this._layout = params.layout;
    this._isDefault = params.isDefault;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getters =====

  public get identityId(): IdentityId {
    return this._identityId;
  }

  public get name(): string {
    return this._name;
  }

  public get widgets(): readonly WidgetConfig[] {
    return [...this._widgets];
  }

  public get layout(): LayoutConfig {
    return { ...this._layout };
  }

  public get isDefault(): boolean {
    return this._isDefault;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== Widget Access =====

  /**
   * 获取指定 ID 的小部件
   */
  public getWidget(widgetId: WidgetId): WidgetConfig | undefined {
    return this._widgets.find((w) => w.id === widgetId);
  }

  /**
   * 获取指定类型的小部件列表
   */
  public getWidgetsByType(type: string): readonly WidgetConfig[] {
    return this._widgets.filter((w) => w.type === type);
  }

  /**
   * 检查是否存在指定 ID 的小部件
   */
  public hasWidget(widgetId: WidgetId): boolean {
    return this._widgets.some((w) => w.id === widgetId);
  }

  // ===== Factory Methods =====

  public static fromDTO(dto: DashboardConfigDTO): DashboardConfig {
    const widgets: WidgetConfig[] = dto.widgets ? JSON.parse(dto.widgets) : [];

    const layout: LayoutConfig = dto.layout
      ? JSON.parse(dto.layout)
      : { columns: 12, rowHeight: 100, gap: 16 };

    return new DashboardConfig({
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      widgets,
      layout,
      isDefault: dto.isDefault,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 创建默认仪表盘配置
   */
  public static createDefault(params: {
    id: string;
    identityId: string;
    name?: string;
  }): DashboardConfig {
    const now = new Date();
    return new DashboardConfig({
      id: params.id,
      identityId: params.identityId,
      name: params.name ?? 'Default Dashboard',
      widgets: [],
      layout: { columns: 12, rowHeight: 100, gap: 16 },
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== DTO Conversion =====

  public toDTO(): DashboardConfigDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      name: this._name,
      widgets: JSON.stringify(this._widgets),
      layout: JSON.stringify(this._layout),
      isDefault: this._isDefault,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }
}

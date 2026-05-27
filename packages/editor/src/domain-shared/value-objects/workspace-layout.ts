/**
 * WorkspaceLayout 值对象
 *
 * 工作区布局：侧边栏位置/宽度、面板位置/高度、可见性
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type {
  IWorkspaceLayout,
  WorkspaceLayoutDTO,
} from '@dailyuse/contracts/editor';

type SidebarPosition = 'Left' | 'Right';
type PanelPosition = 'Bottom' | 'Right';

/**
 * WorkspaceLayout 值对象实现
 */
export class WorkspaceLayout
  extends ValueObject<WorkspaceLayoutDTO>
  implements IWorkspaceLayout
{
  private constructor(props: WorkspaceLayoutDTO) {
    super(props);
  }

  // ================= 工厂方法 =================

  public static create(props: WorkspaceLayoutDTO): WorkspaceLayout {
    return new WorkspaceLayout(props);
  }

  public static createDefault(): WorkspaceLayout {
    return new WorkspaceLayout({
      sidebarPosition: 'Left',
      sidebarWidth: 300,
      panelPosition: 'Bottom',
      panelHeight: 200,
      isSidebarVisible: true,
      isPanelVisible: false,
    });
  }

  public static fromDTO(dto: WorkspaceLayoutDTO): WorkspaceLayout {
    return new WorkspaceLayout(dto);
  }

  // ================= Getters =================

  public get sidebarPosition(): SidebarPosition {
    return this.props.sidebarPosition;
  }

  public get sidebarWidth(): number {
    return this.props.sidebarWidth;
  }

  public get panelPosition(): PanelPosition {
    return this.props.panelPosition;
  }

  public get panelHeight(): number {
    return this.props.panelHeight;
  }

  public get isSidebarVisible(): boolean {
    return this.props.isSidebarVisible;
  }

  public get isPanelVisible(): boolean {
    return this.props.isPanelVisible;
  }

  // ================= 行为方法 =================

  public with(updates: Partial<WorkspaceLayoutDTO>): WorkspaceLayout {
    return new WorkspaceLayout({ ...this.props, ...updates });
  }

  public toggleSidebar(): WorkspaceLayout {
    return this.with({ isSidebarVisible: !this.props.isSidebarVisible });
  }

  public togglePanel(): WorkspaceLayout {
    return this.with({ isPanelVisible: !this.props.isPanelVisible });
  }

  public setSidebarWidth(width: number): WorkspaceLayout {
    return this.with({ sidebarWidth: Math.max(100, Math.min(600, width)) });
  }

  public setPanelHeight(height: number): WorkspaceLayout {
    return this.with({ panelHeight: Math.max(100, Math.min(600, height)) });
  }

  public moveSidebarToLeft(): WorkspaceLayout {
    return this.with({ sidebarPosition: 'Left' });
  }

  public moveSidebarToRight(): WorkspaceLayout {
    return this.with({ sidebarPosition: 'Right' });
  }

  // ================= 计算属性 =================

  public get isSidebarOnLeft(): boolean {
    return this.props.sidebarPosition === 'Left';
  }

  public get isPanelOnBottom(): boolean {
    return this.props.panelPosition === 'Bottom';
  }

  // ================= 序列化 =================

  public toDTO(): WorkspaceLayoutDTO {
    return { ...this.props };
  }
}

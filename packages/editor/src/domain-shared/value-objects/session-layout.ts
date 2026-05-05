/**
 * SessionLayout 值对象
 *
 * 会话布局：分割类型、分组数量、活动分组索引
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  ISessionLayout,
  SessionLayoutDTO,
} from '@dailyuse/contracts/editor';

type SplitType = 'Horizontal' | 'Vertical' | 'Grid';

/**
 * SessionLayout 值对象实现
 */
export class SessionLayout
  extends ValueObject<SessionLayoutDTO>
  implements ISessionLayout
{
  private constructor(props: SessionLayoutDTO) {
    super(props);
  }

  // ================= 工厂方法 =================

  public static create(props: SessionLayoutDTO): SessionLayout {
    return new SessionLayout(props);
  }

  public static createDefault(): SessionLayout {
    return new SessionLayout({
      splitType: 'Horizontal',
      groupCount: 1,
      activeGroupIndex: 0,
    });
  }

  public static createSplit(type: SplitType): SessionLayout {
    return new SessionLayout({
      splitType: type,
      groupCount: 2,
      activeGroupIndex: 0,
    });
  }

  public static fromDTO(dto: SessionLayoutDTO): SessionLayout {
    return new SessionLayout(dto);
  }

  // ================= Getters =================

  public get splitType(): SplitType {
    return this.props.splitType;
  }

  public get groupCount(): number {
    return this.props.groupCount;
  }

  public get activeGroupIndex(): number {
    return this.props.activeGroupIndex;
  }

  // ================= 行为方法 =================

  public with(updates: Partial<SessionLayoutDTO>): SessionLayout {
    return new SessionLayout({ ...this.props, ...updates });
  }

  public setSplitType(splitType: SplitType): SessionLayout {
    return this.with({ splitType });
  }

  public addGroup(): SessionLayout {
    return this.with({ groupCount: this.props.groupCount + 1 });
  }

  public removeGroup(): SessionLayout {
    if (this.props.groupCount <= 1) return this;
    const newCount = this.props.groupCount - 1;
    const activeIndex = Math.min(this.props.activeGroupIndex, newCount - 1);
    return this.with({ groupCount: newCount, activeGroupIndex: activeIndex });
  }

  public setActiveGroup(index: number): SessionLayout {
    if (index < 0 || index >= this.props.groupCount) return this;
    return this.with({ activeGroupIndex: index });
  }

  // ================= 计算属性 =================

  public get isSingleGroup(): boolean {
    return this.props.groupCount === 1;
  }

  public get isHorizontalSplit(): boolean {
    return this.props.splitType === 'Horizontal';
  }

  public get isVerticalSplit(): boolean {
    return this.props.splitType === 'Vertical';
  }

  public get isGridLayout(): boolean {
    return this.props.splitType === 'Grid';
  }

  // ================= 序列化 =================

  public toDTO(): SessionLayoutDTO {
    return { ...this.props };
  }
}

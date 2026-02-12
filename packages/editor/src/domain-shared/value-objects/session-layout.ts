/**
 * SessionLayout 值对象
 * 
 * 会话布局：分割类型、分组数量、活动分组索引
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  ISessionLayoutServer,
  SessionLayoutServerDTO,
  SessionLayoutPersistenceDTO,
} from '@dailyuse/contracts/editor';

type SplitType = 'horizontal' | 'vertical' | 'grid';

/**
 * SessionLayout 值对象实现
 */
export class SessionLayout extends ValueObject<SessionLayoutServerDTO> implements ISessionLayoutServer {

  private constructor(props: SessionLayoutServerDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: SessionLayoutServerDTO): SessionLayout {
    return new SessionLayout(props);
  }

  public static createDefault(): SessionLayout {
    return new SessionLayout({
      splitType: 'horizontal',
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

  public static fromDTO(dto: SessionLayoutServerDTO): SessionLayout {
    return new SessionLayout(dto);
  }

  public static fromPersistenceDTO(dto: SessionLayoutPersistenceDTO): SessionLayout {
    return new SessionLayout({
      splitType: dto.split_type,
      groupCount: dto.group_count,
      activeGroupIndex: dto.active_group_index,
    });
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

  public with(
    updates: Partial<SessionLayoutServerDTO>,
  ): SessionLayout {
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
    return this.props.splitType === 'horizontal';
  }

  public get isVerticalSplit(): boolean {
    return this.props.splitType === 'vertical';
  }

  public get isGridLayout(): boolean {
    return this.props.splitType === 'grid';
  }

  // ================= 序列化 =================

  public toServerDTO(): SessionLayoutServerDTO {
    return { ...this.props };
  }

  public toPersistenceDTO(): SessionLayoutPersistenceDTO {
    return {
      split_type: this.props.splitType,
      group_count: this.props.groupCount,
      active_group_index: this.props.activeGroupIndex,
    };
  }
}

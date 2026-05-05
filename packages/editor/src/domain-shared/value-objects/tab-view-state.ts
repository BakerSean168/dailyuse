/**
 * TabViewState 值对象
 * 
 * 标签页视图状态：滚动位置、光标位置、选区
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  ITabViewState,
  TabViewStateDTO,
} from '@dailyuse/contracts/editor';

interface CursorPosition {
  line: number;
  column: number;
}

interface Selection {
  start: CursorPosition;
  end: CursorPosition;
}

/**
 * TabViewState 值对象实现
 */
export class TabViewState extends ValueObject<TabViewStateDTO> implements ITabViewState {

  private constructor(props: TabViewStateDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: TabViewStateDTO): TabViewState {
    return new TabViewState(props);
  }

  public static createDefault(): TabViewState {
    return new TabViewState({
      scrollTop: 0,
      scrollLeft: 0,
      cursorPosition: { line: 1, column: 1 },
      selections: null,
    });
  }

  public static fromDTO(dto: TabViewStateDTO): TabViewState {
    return new TabViewState(dto);
  }

  // ================= Getters =================

  public get scrollTop(): number {
    return this.props.scrollTop;
  }

  public get scrollLeft(): number {
    return this.props.scrollLeft;
  }

  public get cursorPosition(): CursorPosition {
    return { ...this.props.cursorPosition };
  }

  public get selections(): Selection[] | null {
    return this.props.selections !== undefined && this.props.selections !== null
      ? this.props.selections.map(s => ({
          start: { ...s.start },
          end: { ...s.end },
        }))
      : null;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<TabViewStateDTO>,
  ): TabViewState {
    return new TabViewState({ ...this.props, ...updates });
  }

  public setScrollPosition(top: number, left: number = 0): TabViewState {
    return this.with({ scrollTop: top, scrollLeft: left });
  }

  public setCursorPosition(line: number, column: number): TabViewState {
    return this.with({ cursorPosition: { line, column } });
  }

  public setSelections(selections: Selection[] | null): TabViewState {
    return this.with({ selections });
  }

  public clearSelections(): TabViewState {
    return this.with({ selections: null });
  }

  // ================= 计算属性 =================

  public get hasSelections(): boolean {
    return this.props.selections !== undefined &&
           this.props.selections !== null &&
           this.props.selections.length > 0;
  }

  public get selectionCount(): number {
    return this.props.selections?.length ?? 0;
  }

  public get isAtTop(): boolean {
    return this.props.scrollTop === 0;
  }

  public get cursorLine(): number {
    return this.props.cursorPosition.line;
  }

  public get cursorColumn(): number {
    return this.props.cursorPosition.column;
  }

  // ================= 序列化 =================

  public toDTO(): TabViewStateDTO {
    return {
      scrollTop: this.props.scrollTop,
      scrollLeft: this.props.scrollLeft,
      cursorPosition: { ...this.props.cursorPosition },
      selections: this.props.selections !== undefined && this.props.selections !== null
        ? this.props.selections.map(s => ({
            start: { ...s.start },
            end: { ...s.end },
          }))
        : null,
    };
  }
}

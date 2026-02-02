import type { ViewMode as IViewMode } from '@dailyuse/contracts/editor';

/**
 * ViewMode 枚举类型
 */

export type ViewMode = IViewMode & { readonly __brand: unique symbol };

const VALUES: IViewMode[] = ['Editor', 'Preview', 'SplitH', 'SplitV'];

export const ViewMode = {
  Editor: 'Editor' as ViewMode,
  Preview: 'Preview' as ViewMode,
  SplitH: 'SplitH' as ViewMode,
  SplitV: 'SplitV' as ViewMode,

  of(value: string): ViewMode {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ViewMode: ${value}`);
    }
    return value as ViewMode;
  },

  isValid(value: string): value is ViewMode {
    return VALUES.includes(value as IViewMode);
  },

  getAll(): ViewMode[] {
    return VALUES as ViewMode[];
  },

  isSplit(mode: ViewMode): boolean {
    return mode === this.SplitH || mode === this.SplitV;
  },

  isSplitHorizontal(mode: ViewMode): boolean {
    return mode === this.SplitH;
  },

  isSplitVertical(mode: ViewMode): boolean {
    return mode === this.SplitV;
  },

  showsEditor(mode: ViewMode): boolean {
    return mode === this.Editor || mode === this.SplitH || mode === this.SplitV;
  },

  showsPreview(mode: ViewMode): boolean {
    return mode === this.Preview || mode === this.SplitH || mode === this.SplitV;
  },
};

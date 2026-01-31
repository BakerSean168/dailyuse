/**
 * Widget 尺寸枚举
 */
export const WidgetSize = {
  Small: 'Small',
  Medium: 'Medium',
  Large: 'Large',
} as const;

export type WidgetSize = (typeof WidgetSize)[keyof typeof WidgetSize];

/**
 * Widget 尺寸显示文本映射
 */
export const WidgetSizeText: Record<WidgetSize, string> = {
  [WidgetSize.Small]: '小',
  [WidgetSize.Medium]: '中',
  [WidgetSize.Large]: '大',
};

/**
 * 字体大小
 */
export const FontSize = {
  Small: 'Small',
  Medium: 'Medium',
  Large: 'Large',
} as const;

export type FontSize = (typeof FontSize)[keyof typeof FontSize];

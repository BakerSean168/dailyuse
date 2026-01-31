/**
 * 分割方向枚举
 */
export const SplitDirection = {
  Horizontal: 'Horizontal',
  Vertical: 'Vertical',
} as const;

export type SplitDirection = (typeof SplitDirection)[keyof typeof SplitDirection];

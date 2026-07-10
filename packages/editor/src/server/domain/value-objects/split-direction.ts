import { SplitDirection as SplitDirectionContract, type SplitDirection as ISplitDirection } from '@dailyuse/contracts/editor';

/**
 * SplitDirection 枚举类型
 */

export type SplitDirection = ISplitDirection & { readonly __brand: unique symbol };

// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: ISplitDirection[] = Object.values(SplitDirectionContract);

export const SplitDirection = {
  Horizontal: 'Horizontal' as SplitDirection,
  Vertical: 'Vertical' as SplitDirection,

  of(value: string): SplitDirection {
    if (!this.isValid(value)) {
      throw new Error(`Invalid SplitDirection: ${value}`);
    }
    return value as SplitDirection;
  },

  isValid(value: string): value is SplitDirection {
    return VALUES.includes(value as ISplitDirection);
  },

  getAll(): SplitDirection[] {
    return VALUES as SplitDirection[];
  },

  isHorizontal(direction: SplitDirection): boolean {
    return direction === this.Horizontal;
  },

  isVertical(direction: SplitDirection): boolean {
    return direction === this.Vertical;
  },
};

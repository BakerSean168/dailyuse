import { HiddenGoalsMode as HiddenGoalsModeContract, type HiddenGoalsMode as IHiddenGoalsMode } from '@dailyuse/contracts/goal';

export type HiddenGoalsMode = IHiddenGoalsMode & { readonly __brand: unique symbol };

// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IHiddenGoalsMode[] = Object.values(HiddenGoalsModeContract);

export const HiddenGoalsMode = {
  Hide: 'Hide' as HiddenGoalsMode,
  Dim: 'Dim' as HiddenGoalsMode,
  Collapse: 'Collapse' as HiddenGoalsMode,

  of(value: string): HiddenGoalsMode {
    if (!this.isValid(value)) {
      throw new Error(`Invalid HiddenGoalsMode: ${value}`);
    }
    return value as HiddenGoalsMode;
  },

  isValid(value: string): value is HiddenGoalsMode {
    return VALUES.includes(value as IHiddenGoalsMode);
  },

  getAll(): HiddenGoalsMode[] {
    return VALUES as HiddenGoalsMode[];
  },

  isHide(mode: HiddenGoalsMode): boolean {
    return mode === this.Hide;
  },

  isDim(mode: HiddenGoalsMode): boolean {
    return mode === this.Dim;
  },

  isCollapse(mode: HiddenGoalsMode): boolean {
    return mode === this.Collapse;
  },
};

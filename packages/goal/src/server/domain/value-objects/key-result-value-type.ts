import { KeyResultValueType as KeyResultValueTypeContract, type KeyResultValueType as IKeyResultValueType } from '@dailyuse/contracts/goal';

export type KeyResultValueType = IKeyResultValueType & { readonly __brand: unique symbol };

// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IKeyResultValueType[] = Object.values(KeyResultValueTypeContract);

export const KeyResultValueType = {
  Incremental: 'Incremental' as KeyResultValueType,
  Absolute: 'Absolute' as KeyResultValueType,
  Percentage: 'Percentage' as KeyResultValueType,
  Binary: 'Binary' as KeyResultValueType,

  of(value: string): KeyResultValueType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid KeyResultValueType: ${value}`);
    }
    return value as KeyResultValueType;
  },

  isValid(value: string): value is KeyResultValueType {
    return VALUES.includes(value as IKeyResultValueType);
  },

  getAll(): KeyResultValueType[] {
    return VALUES as KeyResultValueType[];
  },

  isIncremental(type: KeyResultValueType): boolean {
    return type === this.Incremental;
  },

  isAbsolute(type: KeyResultValueType): boolean {
    return type === this.Absolute;
  },

  isPercentage(type: KeyResultValueType): boolean {
    return type === this.Percentage;
  },

  isBinary(type: KeyResultValueType): boolean {
    return type === this.Binary;
  },

  requiresMetric(type: KeyResultValueType): boolean {
    return type !== this.Binary;
  },
};

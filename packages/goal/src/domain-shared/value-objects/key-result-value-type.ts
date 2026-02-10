import type { KeyResultValueType as IKeyResultValueType } from '@dailyuse/contracts/goal';

export type KeyResultValueType = IKeyResultValueType & { readonly __brand: unique symbol };

const VALUES: IKeyResultValueType[] = ['Incremental', 'Absolute', 'Percentage', 'Binary'];

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

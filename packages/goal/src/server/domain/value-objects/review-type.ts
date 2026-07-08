import type { ReviewType as IReviewType } from '@dailyuse/contracts/goal';

export type ReviewType = IReviewType & { readonly __brand: unique symbol };

const VALUES: IReviewType[] = ['Weekly', 'Monthly', 'Quarterly', 'Annual', 'Adhoc', 'Final'];

export const ReviewType = {
  Weekly: 'Weekly' as ReviewType,
  Monthly: 'Monthly' as ReviewType,
  Quarterly: 'Quarterly' as ReviewType,
  Annual: 'Annual' as ReviewType,
  Adhoc: 'Adhoc' as ReviewType,
  Final: 'Final' as ReviewType,

  of(value: string): ReviewType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid ReviewType: ${value}`);
    }
    return value as ReviewType;
  },

  isValid(value: string): value is ReviewType {
    return VALUES.includes(value as IReviewType);
  },

  getAll(): ReviewType[] {
    return VALUES as ReviewType[];
  },

  isPeriodic(type: ReviewType): boolean {
    return type !== this.Adhoc && type !== this.Final;
  },

  isFinal(type: ReviewType): boolean {
    return type === this.Final;
  },
};

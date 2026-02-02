import type { QuotaResetPeriod as IQuotaResetPeriod } from '@dailyuse/contracts/ai';

/**
 * QuotaResetPeriod 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 */

export type QuotaResetPeriod = IQuotaResetPeriod & { readonly __brand: unique symbol };

const VALUES: IQuotaResetPeriod[] = ['Daily', 'Weekly', 'Monthly'];

export const QuotaResetPeriod = {
  Daily: 'Daily' as QuotaResetPeriod,
  Weekly: 'Weekly' as QuotaResetPeriod,
  Monthly: 'Monthly' as QuotaResetPeriod,

  of(value: string): QuotaResetPeriod {
    if (!this.isValid(value)) {
      throw new Error(`Invalid QuotaResetPeriod: ${value}`);
    }
    return value as QuotaResetPeriod;
  },

  isValid(value: string): value is QuotaResetPeriod {
    return VALUES.includes(value as IQuotaResetPeriod);
  },

  getAll(): QuotaResetPeriod[] {
    return VALUES as QuotaResetPeriod[];
  },

  isDaily(period: QuotaResetPeriod): boolean {
    return period === this.Daily;
  },

  isWeekly(period: QuotaResetPeriod): boolean {
    return period === this.Weekly;
  },

  isMonthly(period: QuotaResetPeriod): boolean {
    return period === this.Monthly;
  },
};

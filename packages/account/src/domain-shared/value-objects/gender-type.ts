import type { GenderType as IGenderType } from '@dailyuse/contracts/account';

export type GenderType = IGenderType & { readonly __brand: unique symbol };

const VALUES: IGenderType[] = ['Male', 'Female', 'Other', 'PreferNotToSay'];

export const GenderType = {
  Male: 'Male' as GenderType,
  Female: 'Female' as GenderType,
  Other: 'Other' as GenderType,
  PreferNotToSay: 'PreferNotToSay' as GenderType,

  of(value: string): GenderType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid gender type: ${value}`);
    }
    return value;
  },

  isValid(value: string): value is GenderType {
    return VALUES.includes(value as IGenderType);
  },

  getAll(): GenderType[] {
    return VALUES as GenderType[];
  },

  isSpecified(gender: GenderType): boolean {
    return gender !== this.PreferNotToSay;
  },
};

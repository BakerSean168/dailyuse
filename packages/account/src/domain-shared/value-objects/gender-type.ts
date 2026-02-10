import type { GenderType as IGenderType } from '@dailyuse/contracts/account';

export type GenderType = IGenderType & { readonly __brand: unique symbol };

const VALUES: IGenderType[] = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];

export const GenderType = {
  MALE: 'MALE' as GenderType,
  FEMALE: 'FEMALE' as GenderType,
  OTHER: 'OTHER' as GenderType,
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY' as GenderType,

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
    return gender !== this.PREFER_NOT_TO_SAY;
  },
};

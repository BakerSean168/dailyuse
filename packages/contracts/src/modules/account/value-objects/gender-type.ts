/**
 * 性别
 */

export const GenderType = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
    PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
}

export type GenderType = keyof typeof GenderType;
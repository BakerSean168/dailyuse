/**
 * Account Module - Mock Generators
 *
 * Provides factory functions for generating realistic mock data
 * that conforms to the Account module contracts.
 *
 * Usage:
 * ```ts
 * import { createMockAccount } from '@dailyuse/contracts/mocks';
 * const account = createMockAccount();
 * ```
 */

import { faker } from '@faker-js/faker';
import type { AccountClientDTO } from '../modules/account';
import type { IdentityId } from '@/primitives/ids';

// ============================================================================
// AccountClientDTO
// ============================================================================

/**
 * Creates a single mock AccountClientDTO.
 * Pass overrides to customise specific fields.
 */
export function createMockAccount(
  overrides: Partial<AccountClientDTO> = {},
): AccountClientDTO {
  const now = Date.now();

  return {
    id: faker.string.uuid() as IdentityId,
    status: 'ACTIVE',
    profile: {
      nickname: faker.internet.username(),
      realName: faker.datatype.boolean() ? faker.person.fullName() : null,
      avatarUrl: faker.datatype.boolean() ? faker.image.avatar() : null,
      bio: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      gender: faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const),
      birthday: null,
    },
    settings: {
      theme: faker.helpers.arrayElement(['LIGHT', 'DARK', 'SYSTEM'] as const),
      language: faker.helpers.arrayElement(['zh-CN', 'en-US', 'ja-JP'] as const),
      timezone: faker.location.timeZone(),
      notificationEnabled: faker.datatype.boolean(),
    },
    email: {
      address: faker.internet.email(),
      isVerified: true,
      verifiedAt: Date.now(),
      isPrimary: true,
    },
    phone: null,
    version: 1,
    createdAt: now - faker.number.int({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as AccountClientDTO;
}

/**
 * Authentication Module - Mock Generators
 *
 * Provides factory functions for generating realistic mock data
 * that conforms to the Authentication module contracts.
 *
 * Usage:
 * ```ts
 * import { createMockAuthResponse } from '@memoflow/contracts/mocks';
 * const authResponse = createMockAuthResponse();
 * ```
 */

import { faker } from '@faker-js/faker';
import type { AuthResponseDTO } from '../modules/authentication/dtos/auth-response';
import type { IdentityId, AuthCredentialId, AuthSessionId } from '../primitives/ids';

// ============================================================================
// AuthResponseDTO
// ============================================================================

/**
 * Creates a mock AuthResponseDTO (login/register response).
 */
export function createMockAuthResponse(overrides: Partial<AuthResponseDTO> = {}): AuthResponseDTO {
  const now = Date.now();
  const identityId = faker.string.uuid() as IdentityId;

  return {
    accessToken: faker.string.alphanumeric(64),
    refreshToken: faker.string.alphanumeric(64),
    identity: {
      id: identityId,
      status: 'Active',
      failedLoginAttempts: 0,
      lastFailedAttempt: null,
      lockedUntil: null,
      identifiers: [
        {
          type: 'Email' as const,
          value: faker.internet.email(),
          isVerified: true,
        },
      ],
      credentials: [
        {
          id: faker.string.uuid() as unknown as AuthCredentialId,
          type: 'Password' as const,
          displayName: 'Password',
          lastUsedAt: now,
          isPrimary: true,
          version: 1,
          createdAt: now - faker.number.int({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
          updatedAt: now,
          deletedAt: null,
        },
      ],
      hasPassword: true,
      hasEmail: true,
      hasPhone: false,
      hasOAuth: false,
      version: 1,
      createdAt: now - faker.number.int({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }),
      updatedAt: now,
      deletedAt: null,
    },
    session: {
      id: faker.string.uuid() as unknown as AuthSessionId,
      identityId,
      deviceInfo: {
        deviceId: faker.string.uuid(),
        deviceFingerprint: faker.string.alphanumeric(32),
        deviceType: 'Browser' as const,
        deviceName: null,
        os: null,
        osVersion: null,
        browser: faker.internet.userAgent(),
        appVersion: null,
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        location: null,
        firstSeenAt: now,
        lastSeenAt: now,
      },
      isCurrentSession: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      lastActiveAt: now,
      deletedAt: null,
    },
    ...overrides,
  };
}

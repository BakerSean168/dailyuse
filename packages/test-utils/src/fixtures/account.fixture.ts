/**
 * Account / Identity test fixtures
 *
 * Provides factory functions for generating test IdentityId values
 * and minimal account-related test data.
 */

import { IdentityId } from '@dailyuse/domain-shared';

/**
 * Generate a branded IdentityId for tests.
 * Uses the domain's own `IdentityId.generate()` to ensure the prefix format is correct.
 *
 * @param value - Optional raw string to cast (e.g., 'test-user-123')
 */
export function anIdentityId(value?: string): IdentityId {
  if (value) return IdentityId.of(value);
  return IdentityId.generate();
}

/**
 * Well-known test identity for deterministic assertions.
 * Use this when you need the same identity across related test objects.
 */
export const TEST_IDENTITY_ID = IdentityId.of('IdentityId_test-user-001');

/**
 * Auth identity repository surface (stage-6 residual):
 * Phone login is not a first-party surface. PhoneIdentifier domain types may
 * still appear on portable identity data, but phone lookup is not a runtime port.
 */
import { describe, expect, it } from 'vitest';
import type { IAuthIdentityRepository } from '../i-auth-identity.repository';

describe('IAuthIdentityRepository surface', () => {
  it('documents the wired identity lookup surface without phone login queries', () => {
    const required: Array<keyof IAuthIdentityRepository> = [
      'save',
      'findById',
      'findByEmail',
      'findByOAuth',
      'existsByEmail',
      'delete',
    ];

    expect(required).toEqual([
      'save',
      'findById',
      'findByEmail',
      'findByOAuth',
      'existsByEmail',
      'delete',
    ]);

    // Compile-time surface: phone lookup keys are not part of the port.
    type PhoneLookup = 'findByPhone' | 'existsByPhone';
    type HasPhoneLookup = PhoneLookup extends keyof IAuthIdentityRepository ? true : false;
    const hasPhoneLookup: HasPhoneLookup = false;
    expect(hasPhoneLookup).toBe(false);
  });
});

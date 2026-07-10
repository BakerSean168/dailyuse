import { describe, expect, it } from 'vitest';

import { createAuthenticationApiModule } from './module';

describe('createAuthenticationApiModule', () => {
  it('builds a module definition from an injected jwt secret', () => {
    const module = createAuthenticationApiModule({ jwtSecret: 'a'.repeat(32) });

    expect(module.name).toBe('Authentication');
    expect(typeof module.register).toBe('function');
  });

  it('throws when no jwt secret is injected', () => {
    expect(() => createAuthenticationApiModule({ jwtSecret: '' })).toThrow(/jwtSecret/i);
  });

  it('does not fall back to process.env for the jwt secret', () => {
    const original = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'env-secret-should-not-be-used-at-all-32chars';
    try {
      // Missing injected secret must fail fast even when the env var is set,
      // proving the module no longer reads process.env directly.
      expect(() => createAuthenticationApiModule({ jwtSecret: undefined as unknown as string })).toThrow(
        /jwtSecret/i,
      );
    } finally {
      if (original === undefined) {
        delete process.env.JWT_SECRET;
      } else {
        process.env.JWT_SECRET = original;
      }
    }
  });
});

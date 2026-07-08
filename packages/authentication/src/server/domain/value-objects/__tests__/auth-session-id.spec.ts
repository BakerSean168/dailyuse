import { describe, expect, it } from 'vitest';
import { AuthSessionId } from '../auth-session-id';

describe('AuthSessionId', () => {
  it('round-trips generated ids through the runtime guard', () => {
    const value = AuthSessionId.generate();

    expect(AuthSessionId.is(value)).toBe(true);
    expect(AuthSessionId.of(value)).toBe(value);
  });
});

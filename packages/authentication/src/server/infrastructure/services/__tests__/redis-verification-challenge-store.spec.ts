import { beforeEach, describe, expect, it } from 'vitest';
import {
  ChallengeCooldownError,
  ChallengeRateLimitError,
  VerificationChallengePurpose,
} from '../../../domain';
import {
  RedisVerificationChallengeStore,
  type RedisChallengeClient,
} from '../redis-verification-challenge-store';
import {
  createVerificationChallengeStore,
  IncompleteRedisChallengeConfigError,
  resolveChallengeStoreBackend,
} from '../create-verification-challenge-store';

/** In-memory fake Redis for unit tests (no network). */
function createFakeRedis(): RedisChallengeClient & {
  store: Map<string, { value: string; expiresAt?: number }>;
} {
  const store = new Map<string, { value: string; expiresAt?: number }>();

  const get = async (key: string): Promise<string | null> => {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== undefined && entry.expiresAt < Date.now()) {
      store.delete(key);
      return null;
    }
    return entry.value;
  };

  const setex = async (key: string, seconds: number, value: string): Promise<'OK'> => {
    store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    return 'OK';
  };

  const del = async (...keys: string[]): Promise<number> => {
    let n = 0;
    for (const k of keys) {
      if (store.delete(k)) n += 1;
    }
    return n;
  };

  return { store, get, setex, del };
}

describe('resolveChallengeStoreBackend', () => {
  it('defaults to memory', () => {
    expect(resolveChallengeStoreBackend({})).toBe('memory');
    expect(resolveChallengeStoreBackend({ AUTH_CHALLENGE_STORE: 'REDIS' })).toBe('redis');
  });
});

describe('createVerificationChallengeStore', () => {
  it('returns memory by default', () => {
    const store = createVerificationChallengeStore({ env: {} });
    expect(store.constructor.name).toBe('InMemoryVerificationChallengeStore');
  });

  it('requires redis client when backend is redis', () => {
    expect(() =>
      createVerificationChallengeStore({ env: { AUTH_CHALLENGE_STORE: 'redis' } }),
    ).toThrow(IncompleteRedisChallengeConfigError);
  });

  it('builds Redis store when client provided', async () => {
    const redis = createFakeRedis();
    const store = createVerificationChallengeStore({
      env: { AUTH_CHALLENGE_STORE: 'redis' },
      redis,
    });
    const code = await store.issue({
      purpose: VerificationChallengePurpose.EmailVerify,
      subject: 'a@b.co',
    });
    expect(code).toMatch(/^\d{6}$/);
    await expect(
      store.consume({
        purpose: VerificationChallengePurpose.EmailVerify,
        subject: 'a@b.co',
        challenge: code,
      }),
    ).resolves.toBe(true);
  });
});

describe('RedisVerificationChallengeStore', () => {
  let redis: ReturnType<typeof createFakeRedis>;
  let store: RedisVerificationChallengeStore;

  beforeEach(() => {
    redis = createFakeRedis();
    store = new RedisVerificationChallengeStore({ redis });
  });

  it('issues and consumes once (hash only in redis)', async () => {
    const code = await store.issue({
      purpose: VerificationChallengePurpose.PasswordReset,
      subject: 'User@Example.com',
    });
    expect(code).toMatch(/^\d{6}$/);

    // No plaintext code in stored values
    for (const entry of redis.store.values()) {
      expect(entry.value).not.toContain(code);
    }

    await expect(
      store.consume({
        purpose: VerificationChallengePurpose.PasswordReset,
        subject: 'user@example.com',
        challenge: code,
      }),
    ).resolves.toBe(true);

    await expect(
      store.consume({
        purpose: VerificationChallengePurpose.PasswordReset,
        subject: 'user@example.com',
        challenge: code,
      }),
    ).resolves.toBe(false);
  });

  it('enforces cooldown', async () => {
    await store.issue({
      purpose: VerificationChallengePurpose.PasswordReset,
      subject: 'cool@example.com',
    });
    await expect(
      store.issue({
        purpose: VerificationChallengePurpose.PasswordReset,
        subject: 'cool@example.com',
      }),
    ).rejects.toBeInstanceOf(ChallengeCooldownError);
  });

  it('enforces daily budget', async () => {
    const subject = 'limit@example.com';
    // Seed budget at limit via direct redis write
    const logical = `PasswordReset:${subject}`;
    await redis.setex!(
      `auth:vchallenge:b:${logical}`,
      3600,
      JSON.stringify({
        lastIssuedAt: Date.now() - 120_000,
        issuesOnDay: 10,
        dayKey: new Date().toISOString().slice(0, 10),
      }),
    );
    await expect(
      store.issue({
        purpose: VerificationChallengePurpose.PasswordReset,
        subject,
      }),
    ).rejects.toBeInstanceOf(ChallengeRateLimitError);
  });

  it('rejects wrong code then accepts correct before max failures', async () => {
    const code = await store.issue({
      purpose: VerificationChallengePurpose.EmailVerify,
      subject: 'x@y.z',
    });
    const wrong = code === '999999' ? '999998' : '999999';
    await expect(
      store.consume({
        purpose: VerificationChallengePurpose.EmailVerify,
        subject: 'x@y.z',
        challenge: wrong,
      }),
    ).resolves.toBe(false);
    await expect(
      store.consume({
        purpose: VerificationChallengePurpose.EmailVerify,
        subject: 'x@y.z',
        challenge: code,
      }),
    ).resolves.toBe(true);
  });
});

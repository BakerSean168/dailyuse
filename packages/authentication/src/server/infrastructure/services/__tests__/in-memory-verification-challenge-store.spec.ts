import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryVerificationChallengeStore } from '../in-memory-verification-challenge-store';
import {
  ChallengeCooldownError,
  ChallengeRateLimitError,
  VerificationChallengePurpose,
} from '../../../domain';

describe('InMemoryVerificationChallengeStore', () => {
  let store: InMemoryVerificationChallengeStore;

  beforeEach(() => {
    store = new InMemoryVerificationChallengeStore();
  });

  it('issues a 6-digit code and consumes it once', async () => {
    const code = await store.issue({
      purpose: VerificationChallengePurpose.PasswordReset,
      subject: 'User@Example.com',
    });

    expect(code).toMatch(/^\d{6}$/);

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

  it('rejects wrong challenges without revealing the real code', async () => {
    const code = await store.issue({
      purpose: VerificationChallengePurpose.EmailVerify,
      subject: 'a@b.com',
    });

    const wrong = code === '999999' ? '999998' : '999999';
    await expect(
      store.consume({
        purpose: VerificationChallengePurpose.EmailVerify,
        subject: 'a@b.com',
        challenge: wrong,
      }),
    ).resolves.toBe(false);

    await expect(
      store.consume({
        purpose: VerificationChallengePurpose.EmailVerify,
        subject: 'a@b.com',
        challenge: code,
      }),
    ).resolves.toBe(true);
  });

  it('rejects expired challenges', async () => {
    const code = await store.issue({
      purpose: VerificationChallengePurpose.PasswordReset,
      subject: 'expire@example.com',
    });
    store.expireForTests(VerificationChallengePurpose.PasswordReset, 'expire@example.com');

    await expect(
      store.consume({
        purpose: VerificationChallengePurpose.PasswordReset,
        subject: 'expire@example.com',
        challenge: code,
      }),
    ).resolves.toBe(false);
  });

  it('enforces send cooldown between issues', async () => {
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

  it('isolates purposes for the same subject', async () => {
    const resetCode = await store.issue({
      purpose: VerificationChallengePurpose.PasswordReset,
      subject: 'both@example.com',
    });
    const verifyCode = await store.issue({
      purpose: VerificationChallengePurpose.EmailVerify,
      subject: 'both@example.com',
    });

    await expect(
      store.consume({
        purpose: VerificationChallengePurpose.PasswordReset,
        subject: 'both@example.com',
        challenge: verifyCode,
      }),
    ).resolves.toBe(false);

    await expect(
      store.consume({
        purpose: VerificationChallengePurpose.PasswordReset,
        subject: 'both@example.com',
        challenge: resetCode,
      }),
    ).resolves.toBe(true);

    // Reset may have burned attempts on wrong code; re-issue verify path cleanly
    store.clearForTests();
    const freshVerify = await store.issue({
      purpose: VerificationChallengePurpose.EmailVerify,
      subject: 'both@example.com',
    });
    await expect(
      store.consume({
        purpose: VerificationChallengePurpose.EmailVerify,
        subject: 'both@example.com',
        challenge: freshVerify,
      }),
    ).resolves.toBe(true);
  });

  it('invalidates after too many failed attempts', async () => {
    const code = await store.issue({
      purpose: VerificationChallengePurpose.PasswordReset,
      subject: 'attempts@example.com',
    });

    const wrong = code === '111111' ? '222222' : '111111';
    for (let i = 0; i < 5; i += 1) {
      await store.consume({
        purpose: VerificationChallengePurpose.PasswordReset,
        subject: 'attempts@example.com',
        challenge: wrong,
      });
    }

    await expect(
      store.consume({
        purpose: VerificationChallengePurpose.PasswordReset,
        subject: 'attempts@example.com',
        challenge: code,
      }),
    ).resolves.toBe(false);
  });

  it('enforces daily issue budget', async () => {
    store.setIssuesOnDayForTests(
      VerificationChallengePurpose.PasswordReset,
      'limit@example.com',
      10,
    );

    await expect(
      store.issue({
        purpose: VerificationChallengePurpose.PasswordReset,
        subject: 'limit@example.com',
      }),
    ).rejects.toBeInstanceOf(ChallengeRateLimitError);
  });

  it('allows re-issue after cooldown is relaxed', async () => {
    await store.issue({
      purpose: VerificationChallengePurpose.PasswordReset,
      subject: 'again@example.com',
    });
    store.relaxCooldownForTests(VerificationChallengePurpose.PasswordReset, 'again@example.com');

    const second = await store.issue({
      purpose: VerificationChallengePurpose.PasswordReset,
      subject: 'again@example.com',
    });
    expect(second).toMatch(/^\d{6}$/);
  });
});

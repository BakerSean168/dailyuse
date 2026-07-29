/**
 * Redis-backed IVerificationChallengeStore for multi-instance API deployments.
 *
 * Stores only SHA-256 hashes of codes (never plaintext). Cooldown / daily budget
 * live in a separate key with day rollover. Keys use a configurable prefix.
 *
 * Redis client is injected (ioredis-compatible minimal surface) so authentication
 * package does not hard-depend on a specific Redis client version at compile time
 * when unused; apps/api wires real ioredis at composition root.
 */

import type {
  ConsumeVerificationChallengeParams,
  IssueVerificationChallengeParams,
  IVerificationChallengeStore,
} from '../../domain/services/i-verification-challenge-store';
import {
  ChallengeCooldownError,
  ChallengeRateLimitError,
} from '../../domain/services/i-verification-challenge-store';
import {
  challengeSubjectKey,
  CODE_TTL_MS,
  COOLDOWN_MS,
  generateRandomChallengeCode,
  hashChallengeCode,
  MAX_FAILED_ATTEMPTS,
  MAX_ISSUES_PER_DAY,
  utcDayKey,
} from './verification-challenge-constants';

/**
 * Minimal Redis surface used by this store.
 * Only `get` / `setex` / `del` — avoids ioredis `set` overload assignability issues.
 */
export type RedisChallengeClient = {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
};

interface StoredChallenge {
  readonly codeHash: string;
  readonly expiresAt: number;
  failedAttempts: number;
  readonly identityId?: string;
}

interface StoredBudget {
  lastIssuedAt: number;
  issuesOnDay: number;
  dayKey: string;
}

export type RedisVerificationChallengeStoreOptions = {
  readonly redis: RedisChallengeClient;
  /** Key namespace, default `auth:vchallenge:` */
  readonly keyPrefix?: string;
};

/**
 * Multi-instance verification challenge store using Redis.
 */
export class RedisVerificationChallengeStore implements IVerificationChallengeStore {
  private readonly redis: RedisChallengeClient;
  private readonly prefix: string;

  constructor(options: RedisVerificationChallengeStoreOptions) {
    this.redis = options.redis;
    this.prefix = options.keyPrefix ?? 'auth:vchallenge:';
  }

  async issue(params: IssueVerificationChallengeParams): Promise<string> {
    const logical = challengeSubjectKey(params.purpose, params.subject);
    const challengeKey = this.challengeKey(logical);
    const budgetKey = this.budgetKey(logical);
    const now = Date.now();
    const dayKey = utcDayKey(now);

    const budgetRaw = await this.redis.get(budgetKey);
    let budget: StoredBudget | null = budgetRaw ? (JSON.parse(budgetRaw) as StoredBudget) : null;

    if (budget) {
      const remainingCooldown = budget.lastIssuedAt + COOLDOWN_MS - now;
      if (remainingCooldown > 0) {
        throw new ChallengeCooldownError(remainingCooldown);
      }
      const issuesOnDay = budget.dayKey === dayKey ? budget.issuesOnDay : 0;
      if (issuesOnDay >= MAX_ISSUES_PER_DAY) {
        throw new ChallengeRateLimitError();
      }
    }

    const code = generateRandomChallengeCode();
    const previousIssues = budget && budget.dayKey === dayKey ? budget.issuesOnDay : 0;
    const nextBudget: StoredBudget = {
      lastIssuedAt: now,
      issuesOnDay: previousIssues + 1,
      dayKey,
    };
    const challenge: StoredChallenge = {
      codeHash: hashChallengeCode(code),
      expiresAt: now + CODE_TTL_MS,
      failedAttempts: 0,
      identityId: params.identityId,
    };

    // Challenge TTL slightly past expiresAt for clock skew; budget kept for a day+.
    const challengeTtlSec = Math.ceil(CODE_TTL_MS / 1000) + 60;
    const budgetTtlSec = 48 * 60 * 60;

    await this.setJson(challengeKey, challenge, challengeTtlSec);
    await this.setJson(budgetKey, nextBudget, budgetTtlSec);

    return code;
  }

  async consume(params: ConsumeVerificationChallengeParams): Promise<boolean> {
    const logical = challengeSubjectKey(params.purpose, params.subject);
    const challengeKey = this.challengeKey(logical);
    const raw = await this.redis.get(challengeKey);
    if (!raw) {
      return false;
    }

    let stored: StoredChallenge;
    try {
      stored = JSON.parse(raw) as StoredChallenge;
    } catch {
      await this.redis.del(challengeKey);
      return false;
    }

    if (stored.expiresAt < Date.now()) {
      await this.redis.del(challengeKey);
      return false;
    }

    if (stored.codeHash !== hashChallengeCode(params.challenge)) {
      stored.failedAttempts += 1;
      if (stored.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        await this.redis.del(challengeKey);
      } else {
        const remainingMs = Math.max(1000, stored.expiresAt - Date.now());
        await this.setJson(challengeKey, stored, Math.ceil(remainingMs / 1000));
      }
      return false;
    }

    await this.redis.del(challengeKey);
    return true;
  }

  private challengeKey(logical: string): string {
    return `${this.prefix}c:${logical}`;
  }

  private budgetKey(logical: string): string {
    return `${this.prefix}b:${logical}`;
  }

  private async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }
}

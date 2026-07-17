import { createHash, randomInt } from 'node:crypto';
import type {
  ConsumeVerificationChallengeParams,
  IssueVerificationChallengeParams,
  IVerificationChallengeStore,
} from '../../domain/services/i-verification-challenge-store';
import {
  ChallengeCooldownError,
  ChallengeRateLimitError,
} from '../../domain/services/i-verification-challenge-store';

/** Challenge TTL: 10 minutes */
const CODE_TTL_MS = 10 * 60 * 1000;
/** Minimum interval between issues for the same purpose+subject */
const COOLDOWN_MS = 60 * 1000;
/** Failed consume attempts before the challenge is invalidated */
const MAX_FAILED_ATTEMPTS = 5;
/** Max issues per purpose+subject per UTC day */
const MAX_ISSUES_PER_DAY = 10;

interface ActiveChallenge {
  codeHash: string;
  expiresAt: number;
  failedAttempts: number;
  identityId?: string;
}

interface IssueBudget {
  lastIssuedAt: number;
  issuesOnDay: number;
  dayKey: string;
}

/**
 * In-memory IVerificationChallengeStore for development and single-instance runs.
 * 开发与单实例部署用的内存 challenge 存储。
 *
 * Production multi-instance deployments should use Redis or a DB table.
 * 多实例生产环境应替换为 Redis 或数据库实现。
 */
export class InMemoryVerificationChallengeStore implements IVerificationChallengeStore {
  private readonly challenges = new Map<string, ActiveChallenge>();
  private readonly budgets = new Map<string, IssueBudget>();

  async issue(params: IssueVerificationChallengeParams): Promise<string> {
    this.cleanupExpiredChallenges();

    const key = this.key(params.purpose, params.subject);
    const now = Date.now();
    const dayKey = this.utcDayKey(now);
    const budget = this.budgets.get(key);

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

    const code = this.generateRandomCode();
    const previousIssues = budget && budget.dayKey === dayKey ? budget.issuesOnDay : 0;

    this.budgets.set(key, {
      lastIssuedAt: now,
      issuesOnDay: previousIssues + 1,
      dayKey,
    });

    this.challenges.set(key, {
      codeHash: this.hashCode(code),
      expiresAt: now + CODE_TTL_MS,
      failedAttempts: 0,
      identityId: params.identityId,
    });

    return code;
  }

  async consume(params: ConsumeVerificationChallengeParams): Promise<boolean> {
    this.cleanupExpiredChallenges();

    const key = this.key(params.purpose, params.subject);
    const stored = this.challenges.get(key);

    if (!stored) {
      return false;
    }

    if (stored.expiresAt < Date.now()) {
      this.challenges.delete(key);
      return false;
    }

    if (stored.codeHash !== this.hashCode(params.challenge)) {
      stored.failedAttempts += 1;
      if (stored.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        this.challenges.delete(key);
      }
      return false;
    }

    this.challenges.delete(key);
    return true;
  }

  /** Test helper: force-expire the active challenge for a key. */
  expireForTests(purpose: string, subject: string): void {
    const key = this.key(purpose, subject);
    const stored = this.challenges.get(key);
    if (stored) {
      stored.expiresAt = Date.now() - 1;
    }
  }

  /** Test helper: clear cooldown so the next issue is allowed. */
  relaxCooldownForTests(purpose: string, subject: string): void {
    const key = this.key(purpose, subject);
    const budget = this.budgets.get(key);
    if (budget) {
      budget.lastIssuedAt = Date.now() - COOLDOWN_MS - 1;
    }
  }

  /** Test helper: set daily issue count near the limit. */
  setIssuesOnDayForTests(purpose: string, subject: string, issuesOnDay: number): void {
    const key = this.key(purpose, subject);
    const now = Date.now();
    const existing = this.budgets.get(key);
    this.budgets.set(key, {
      lastIssuedAt: existing ? existing.lastIssuedAt - COOLDOWN_MS - 1 : now - COOLDOWN_MS - 1,
      issuesOnDay,
      dayKey: this.utcDayKey(now),
    });
  }

  /** Test helper: clear all entries. */
  clearForTests(): void {
    this.challenges.clear();
    this.budgets.clear();
  }

  private key(purpose: string, subject: string): string {
    return `${purpose}:${subject.trim().toLowerCase()}`;
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code, 'utf8').digest('hex');
  }

  private generateRandomCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private utcDayKey(now: number): string {
    return new Date(now).toISOString().slice(0, 10);
  }

  private cleanupExpiredChallenges(): void {
    const now = Date.now();
    for (const [key, stored] of this.challenges) {
      if (stored.expiresAt < now) {
        this.challenges.delete(key);
      }
    }
  }
}

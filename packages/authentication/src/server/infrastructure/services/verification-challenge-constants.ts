/**
 * Shared policy for verification challenge stores (memory + Redis).
 * Keep in sync across implementations — single source for TTL / cooldown / limits.
 */

import { createHash, randomInt } from 'node:crypto';

/** Challenge TTL: 10 minutes */
export const CODE_TTL_MS = 10 * 60 * 1000;
/** Minimum interval between issues for the same purpose+subject */
export const COOLDOWN_MS = 60 * 1000;
/** Failed consume attempts before the challenge is invalidated */
export const MAX_FAILED_ATTEMPTS = 5;
/** Max issues per purpose+subject per UTC day */
export const MAX_ISSUES_PER_DAY = 10;

export function challengeSubjectKey(purpose: string, subject: string): string {
  return `${purpose}:${subject.trim().toLowerCase()}`;
}

export function utcDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function hashChallengeCode(code: string): string {
  return createHash('sha256').update(code, 'utf8').digest('hex');
}

export function generateRandomChallengeCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/**
 * Random data generation utilities for testing
 *
 * Provides deterministic-friendly random generators for test data.
 * These are NOT cryptographically secure — they are designed for
 * generating unique, readable test values.
 */

import { randomUUID } from 'node:crypto';

/**
 * Generate a v4 UUID
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Generate a random string of the given length
 *
 * @param length - Number of characters (default 8)
 * @param charset - Character set to use: 'alphanumeric' | 'lowercase' | 'uppercase' | 'numbers'
 */
export function randomString(
  length = 8,
  charset: 'alphanumeric' | 'lowercase' | 'uppercase' | 'numbers' = 'alphanumeric',
): string {
  const charsets: Record<string, string> = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
  };

  const chars = charsets[charset];
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random test email address
 *
 * @param prefix - Optional prefix (default 'test')
 */
export function randomEmail(prefix = 'test'): string {
  return `${prefix}-${randomString(6, 'lowercase')}@example.com`;
}

/**
 * Generate a random integer in the given range (inclusive)
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a timestamp offset from now
 *
 * @param offsetMs - Milliseconds offset from Date.now() (negative = past, positive = future)
 */
export function timestampFrom(offsetMs: number): number {
  return Date.now() + offsetMs;
}

/**
 * Common time offsets in milliseconds
 */
export const TimeOffset = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

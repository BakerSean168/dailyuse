/**
 * Custom Vitest matchers for Result<T> assertions
 *
 * Usage:
 *   import '@memoflow/test-utils/helpers/result-matchers';
 *
 *   expect(result).toBeOk();
 *   expect(result).toBeOkWith({ id: 'xxx' });
 *   expect(result).toBeError();
 *   expect(result).toBeErrorWithCode('NOT_FOUND');
 *
 * Register in vitest setup file or import directly in test files.
 */

import { expect } from 'vitest';

interface ResultLike {
  ok: boolean;
  data?: unknown;
  error?: {
    code?: string;
    message?: string;
    details?: unknown[];
  };
}

function isResultLike(value: unknown): value is ResultLike {
  return typeof value === 'object' && value !== null && 'ok' in value;
}

expect.extend({
  /**
   * Assert that a Result is a success (ok === true)
   */
  toBeOk(received: unknown) {
    if (!isResultLike(received)) {
      return {
        pass: false,
        message: () => `Expected a Result object, but received ${typeof received}`,
      };
    }

    return {
      pass: received.ok === true,
      message: () =>
        received.ok
          ? `Expected Result to be a failure, but it was ok with data: ${JSON.stringify(received.data, null, 2)}`
          : `Expected Result to be ok, but it failed with error: ${JSON.stringify(received.error, null, 2)}`,
    };
  },

  /**
   * Assert that a Result is a success and its data contains the expected subset
   *
   * Uses asymmetric matching, so you can do:
   *   expect(result).toBeOkWith({ id: expect.any(String) })
   */
  toBeOkWith(received: unknown, expected: unknown) {
    if (!isResultLike(received)) {
      return {
        pass: false,
        message: () => `Expected a Result object, but received ${typeof received}`,
      };
    }

    if (!received.ok) {
      return {
        pass: false,
        message: () =>
          `Expected Result to be ok with matching data, but it failed with error: ${JSON.stringify(received.error, null, 2)}`,
      };
    }

    const dataMatches = this.equals(
      received.data,
      expect.objectContaining(expected as Record<string, unknown>),
    );

    return {
      pass: dataMatches,
      message: () =>
        dataMatches
          ? `Expected Result data NOT to match ${JSON.stringify(expected, null, 2)}, but it did`
          : `Expected Result data to match ${JSON.stringify(expected, null, 2)}, but received ${JSON.stringify(received.data, null, 2)}`,
    };
  },

  /**
   * Assert that a Result is a failure (ok === false)
   */
  toBeError(received: unknown) {
    if (!isResultLike(received)) {
      return {
        pass: false,
        message: () => `Expected a Result object, but received ${typeof received}`,
      };
    }

    return {
      pass: received.ok === false,
      message: () =>
        received.ok
          ? `Expected Result to be a failure, but it was ok with data: ${JSON.stringify(received.data, null, 2)}`
          : `Expected Result to be ok, but it failed with error: ${JSON.stringify(received.error, null, 2)}`,
    };
  },

  /**
   * Assert that a Result is a failure with a specific error code
   */
  toBeErrorWithCode(received: unknown, expectedCode: string) {
    if (!isResultLike(received)) {
      return {
        pass: false,
        message: () => `Expected a Result object, but received ${typeof received}`,
      };
    }

    if (received.ok) {
      return {
        pass: false,
        message: () =>
          `Expected Result to be a failure with code "${expectedCode}", but it was ok with data: ${JSON.stringify(received.data, null, 2)}`,
      };
    }

    const actualCode = received.error?.code;
    const pass = actualCode === expectedCode;

    return {
      pass,
      message: () =>
        pass
          ? `Expected Result error code NOT to be "${expectedCode}"`
          : `Expected Result error code to be "${expectedCode}", but received "${actualCode}".\nFull error: ${JSON.stringify(received.error, null, 2)}`,
    };
  },
});

/**
 * TypeScript declaration merging for custom matchers
 */
declare module 'vitest' {
  interface CustomMatchers<R = unknown> {
    /** Assert Result is ok (success) */
    toBeOk(): R;
    /** Assert Result is ok and data contains the expected subset */
    toBeOkWith(expected: Record<string, unknown>): R;
    /** Assert Result is a failure */
    toBeError(): R;
    /** Assert Result is a failure with a specific error code */
    toBeErrorWithCode(code: string): R;
  }
}

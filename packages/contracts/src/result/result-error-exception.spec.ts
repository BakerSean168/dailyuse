import { describe, expect, it } from 'vitest';
import { unwrapOrThrowError } from './index';

describe('ResultErrorException', () => {
  it('preserves structured error metadata when unwrapping a failure result', () => {
    expect(() =>
      unwrapOrThrowError({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授权，请登录',
          details: [{ code: 'TOKEN_MISSING', message: 'missing token' }],
          context: { source: 'test' },
        },
      }),
    ).toThrowError(
      expect.objectContaining({
        name: 'ResultErrorException',
        code: 'UNAUTHORIZED',
        message: '未授权，请登录',
        details: [{ code: 'TOKEN_MISSING', message: 'missing token' }],
        context: { source: 'test' },
      }),
    );
  });
});

import type { NextFunction, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { authMiddleware, type AuthenticatedRequest } from './auth-middleware';

describe('authMiddleware', () => {
  it('returns a structured unauthorized response when the bearer token is missing', () => {
    const req = {
      headers: {},
    } as AuthenticatedRequest;
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    authMiddleware(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        code: 401,
        error: expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: '缺少认证令牌，请提供有效的Authorization header',
        }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});

import type { CloudAuth } from '@memoflow/cloud-auth/server';
import type { NextFunction, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { createAuthMiddleware, type AuthenticatedRequest } from './auth-middleware';

function responseStub(): Response {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  return { status, json } as unknown as Response;
}

describe('cloud auth middleware', () => {
  it('returns a structured unauthorized response when no cloud session resolves', async () => {
    const cloudAuth = {
      resolveNodePrincipal: vi.fn().mockResolvedValue(null),
    } as unknown as CloudAuth;
    const req = { headers: {} } as AuthenticatedRequest;
    const res = responseStub();
    const next = vi.fn() as unknown as NextFunction;

    await createAuthMiddleware(cloudAuth)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('maps a cloud principal onto the MemoFlow request identity', async () => {
    const cloudAuth = {
      resolveNodePrincipal: vi.fn().mockResolvedValue({
        identityId: 'user-id',
        sessionId: 'session-id',
        email: 'user@example.com',
        emailVerified: true,
      }),
    } as unknown as CloudAuth;
    const req = { headers: {} } as AuthenticatedRequest;
    const res = responseStub();
    const next = vi.fn() as unknown as NextFunction;

    await createAuthMiddleware(cloudAuth)(req, res, next);

    expect(req.user).toEqual({
      identityId: 'user-id',
      sessionId: 'session-id',
      email: 'user@example.com',
      emailVerified: true,
    });
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects a valid Better Auth session when the cloud Account is closed', async () => {
    const cloudAuth = {
      resolveNodePrincipal: vi.fn().mockResolvedValue({
        identityId: 'user-id',
        sessionId: 'session-id',
        email: 'user@example.com',
        emailVerified: true,
      }),
    } as unknown as CloudAuth;
    const database = {
      account: { findUnique: vi.fn().mockResolvedValue({ status: 'Deactivated' }) },
    };
    const req = { headers: {} } as AuthenticatedRequest;
    const res = responseStub();
    const next = vi.fn() as unknown as NextFunction;

    await createAuthMiddleware(cloudAuth, database as never)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows an active cloud Account after Better Auth resolves', async () => {
    const cloudAuth = {
      resolveNodePrincipal: vi.fn().mockResolvedValue({
        identityId: 'user-id',
        sessionId: 'session-id',
        email: 'user@example.com',
        emailVerified: true,
      }),
    } as unknown as CloudAuth;
    const database = {
      account: { findUnique: vi.fn().mockResolvedValue({ status: 'Active' }) },
    };
    const req = { headers: {} } as AuthenticatedRequest;
    const res = responseStub();
    const next = vi.fn() as unknown as NextFunction;

    await createAuthMiddleware(cloudAuth, database as never)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});

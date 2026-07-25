/**
 * Require verified email for authenticated sensitive routes.
 * 已登录但未验证邮箱时，对敏感路由返回 403 EMAIL_VERIFICATION_REQUIRED。
 *
 * Whitelist (plan B2): me, logout, refresh, email/*, password/*
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthDomainCode } from '../server/domain/services/i-verification-challenge-store';

export type IdentityStatusLookup = (identityId: string) => Promise<string | null>;

export interface EmailVerificationGateOptions {
  readonly lookupStatus: IdentityStatusLookup;
  /**
   * When true (default), enforce gate. Can be disabled for tests.
   */
  readonly enabled?: boolean;
}

/**
 * Residual 1174 keep-boundary: auth email-verification normalizePath — URL route shape.
 * Strips querystring and /api|/api/v1 prefixes for whitelist matching (always returns string).
 * Soft residual 1174: repository storage-config normalizePath is filesystem path trim|null (no force-merge).
 */
function normalizePath(url: string): string {
  // strip querystring
  const pathOnly = url.split('?')[0] ?? url;
  // normalize /api and /api/v1 prefixes
  return pathOnly.replace(/^\/api\/v1/, '').replace(/^\/api/, '');
}

/**
 * Paths allowed while identity remains Unverified (relative to /auth or absolute).
 * 未验证邮箱时仍允许的路径。
 */
export function isEmailVerificationWhitelisted(path: string): boolean {
  const p = normalizePath(path);

  // full path variants under /auth
  if (
    p === '/auth/me' ||
    p === '/auth/logout' ||
    p === '/auth/refresh' ||
    p.startsWith('/auth/email/') ||
    p.startsWith('/auth/password/')
  ) {
    return true;
  }

  // when middleware is mounted under /auth router, path may be relative
  if (
    p === '/me' ||
    p === '/logout' ||
    p === '/refresh' ||
    p.startsWith('/email/') ||
    p.startsWith('/password/')
  ) {
    return true;
  }

  return false;
}

export function createRequireEmailVerifiedMiddleware(
  options: EmailVerificationGateOptions,
): RequestHandler {
  const enabled = options.enabled !== false;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!enabled) {
      next();
      return;
    }

    const identityId = (req as Request & { user?: { identityId?: string }; identityId?: string })
      .user?.identityId ?? (req as Request & { identityId?: string }).identityId;

    // Unauthenticated requests are handled by auth middleware; skip here.
    if (!identityId) {
      next();
      return;
    }

    const path = req.originalUrl || req.url || req.path || '';
    if (isEmailVerificationWhitelisted(path)) {
      next();
      return;
    }

    try {
      const status = await options.lookupStatus(identityId);
      if (status === 'Unverified') {
        res.status(403).json({
          ok: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Email verification is required before continuing.',
            context: {
              domainCode: AuthDomainCode.EMAIL_VERIFICATION_REQUIRED,
            },
          },
        });
        return;
      }
      next();
    } catch (err) {
      console.error('[requireEmailVerified] lookup failed', err);
      // Fail open for lookup errors would weaken security; fail closed with 503.
      res.status(503).json({
        ok: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Unable to verify account status. Please try again.',
        },
      });
    }
  };
}

/**
 * Compose JWT auth + email verification gate into a single RequestHandler.
 * 将 JWT 认证与邮箱验证门禁组合为单一中间件。
 */
export function composeAuthWithEmailVerificationGate(
  auth: RequestHandler,
  gate: RequestHandler,
): RequestHandler {
  return (req, res, next) => {
    auth(req, res, (err?: unknown) => {
      if (err) {
        next(err);
        return;
      }
      // If auth already wrote a response (e.g. 401), stop.
      if (res.headersSent) {
        return;
      }
      void Promise.resolve(gate(req, res, next)).catch(next);
    });
  };
}

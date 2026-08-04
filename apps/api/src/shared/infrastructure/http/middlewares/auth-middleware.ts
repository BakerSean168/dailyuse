import type { CloudAuth } from '@memoflow/cloud-auth/server';
import type { PrismaClient } from '@memoflow/database';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { createApiResponseBuilder } from '../response-builder.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    identityId: string;
    sessionId?: string;
    email?: string;
    emailVerified?: boolean;
  };
}

function sendUnauthorized(req: AuthenticatedRequest, res: Response, message: string): Response {
  return res.status(401).json(createApiResponseBuilder(req).unauthorized(message));
}

function sendInternalError(req: AuthenticatedRequest, res: Response, message: string): Response {
  return res.status(500).json(createApiResponseBuilder(req).internalError(message));
}

export function createAuthMiddleware(
  cloudAuth: CloudAuth,
  database?: Pick<PrismaClient, 'account'>,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const principal = await cloudAuth.resolveNodePrincipal(req.headers);
      if (!principal) {
        return sendUnauthorized(authenticatedReq, res, '云端认证已失效，请重新认证');
      }
      if (database) {
        const account = await database.account.findUnique({
          where: { id: principal.identityId },
          select: { status: true },
        });
        if (!account || account.status !== 'Active') {
          return sendUnauthorized(authenticatedReq, res, '云端账号已关闭或不可用');
        }
      }

      authenticatedReq.user = {
        identityId: principal.identityId,
        sessionId: principal.sessionId,
        email: principal.email,
        emailVerified: principal.emailVerified,
      };
      return next();
    } catch (error) {
      console.error('Cloud authentication middleware failed:', error);
      return sendInternalError(authenticatedReq, res, 'Internal server error');
    }
  };
}

export function createOptionalAuthMiddleware(
  cloudAuth: CloudAuth,
  database?: Pick<PrismaClient, 'account'>,
): RequestHandler {
  const required = createAuthMiddleware(cloudAuth, database);
  return (req, res, next) => {
    if (!req.headers.authorization && !req.headers.cookie) return next();
    return required(req, res, next);
  };
}

export function createRequireEmailVerifiedMiddleware(): RequestHandler {
  return (req, res, next) => {
    const authenticatedReq = req as AuthenticatedRequest;
    if (authenticatedReq.user?.emailVerified) return next();
    return res
      .status(403)
      .json(createApiResponseBuilder(authenticatedReq).forbidden('请先验证登录邮箱'));
  };
}

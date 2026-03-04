/**
 * @file authMiddleware.ts
 * @description JWT 认证中间件，负责解析和验证请求中的 Authorization Token。
 * @date 2025-01-22
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtConfig } from '../../config/env.js';

/**
 * 扩展的请求接口，包含用户认证信息。
 *
 * @remarks
 * 在通过 authMiddleware 后，req 对象将包含 user, identityId 等字段。
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    identityId: string;
    sessionId?: string;
    tokenType?: string;
    exp?: number;
  };
  identityId?: string; // 向后兼容，直接提供identityId
  sessionId?: string; // 当前会话UUID
}

/**
 * JWT 认证中间件。
 *
 * @remarks
 * 从 Authorization header 中提取 JWT token，验证并解析出 identityId。
 * 将用户信息添加到 req.user 和 req.identityId 中。
 *
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - 下一个中间件函数
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // 从 Authorization header 中提取 token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        code: 'UNAUTHORIZED',
        message: '缺少认证令牌，请提供有效的Authorization header',
      });
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    if (!token) {
      return res.status(401).json({
        ok: false,
        code: 'UNAUTHORIZED',
        message: '认证令牌不能为空',
      });
    }

    // 验证 JWT token
    const { secret } = getJwtConfig();

    try {
      const decoded = jwt.verify(token, secret) as any;

      // 验证必要字段
      if (!decoded.identityId) {
        return res.status(401).json({
          ok: false,
          code: 'UNAUTHORIZED',
          message: '无效的认证令牌：缺少用户信息',
        });
      }

      // 检查token是否过期
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({
          ok: false,
          code: 'UNAUTHORIZED',
          message: '认证令牌已过期，请重新登录',
        });
      }

      // 将用户信息添加到请求对象
      req.user = {
        identityId: decoded.identityId,
        sessionId: decoded.sessionId,
        tokenType: decoded.type,
        exp: decoded.exp,
      };

      // 向后兼容：直接提供 identityId 和 sessionId
      req.identityId = decoded.identityId;
      req.sessionId = decoded.sessionId;

      return next();
    } catch (jwtError) {
      console.error('JWT验证失败:', jwtError);
      return res.status(401).json({
        ok: false,
        code: 'UNAUTHORIZED',
        message: '无效的认证令牌，请重新登录',
      });
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};

/**
 * 可选的认证中间件。
 *
 * @remarks
 * 如果提供了token则验证，如果没有提供则继续执行但不设置用户信息。
 * 适用于既可以公开访问又可以认证访问的接口。
 *
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - 下一个中间件函数
 */
export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 没有认证信息，继续执行但不设置用户信息
    return next();
  }

  // 有认证信息，使用标准认证中间件验证
  return authMiddleware(req, res, next);
};

/**
 * 检查用户是否已认证的辅助函数。
 *
 * @param req - AuthenticatedRequest 请求对象
 * @returns identityId 如果已认证
 * @throws Error 如果未认证
 */
export const requireAuth = (req: AuthenticatedRequest): string => {
  if (!req.identityId || !req.user) {
    throw new Error('用户未认证，请先登录');
  }
  return req.identityId;
};

/**
 * 获取当前用户UUID的辅助函数。
 *
 * @param req - AuthenticatedRequest 请求对象
 * @returns identityId 或 null
 */
export const getCurrentAccountId = (req: AuthenticatedRequest): string | null => {
  return req.identityId || null;
};

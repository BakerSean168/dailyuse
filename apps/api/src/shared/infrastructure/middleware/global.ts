/**
 * Global Middleware Configuration
 *
 * 将原 app.ts 中散落的全局中间件提取为独立模块，
 * 由 ApiBootstrapper 在启动时统一调用。
 */

import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { performanceMiddleware } from '../http/middlewares/performance.middleware';
import { getCorsOrigins, isAllCorsOriginsAllowed } from '../config/env.js';

/**
 * 应用所有全局中间件
 *
 * 包含：Helmet、JSON 解析、Cookie 解析、CORS、Compression、性能监控
 */
export function applyGlobalMiddleware(app: Express): void {
  const allowedOrigins = getCorsOrigins();
  const allowAllOrigins = isAllCorsOriginsAllowed();

  // Security
  app.use(helmet());

  // Body parsing
  app.use(cookieParser());

  // CORS
  app.use(
    cors({
      origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin) return callback(null, true);
        if (allowAllOrigins) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: !allowAllOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Skip-Auth', 'Cache-Control'],
      maxAge: 86400,
    }),
  );

  // JSON body parsing (must be after CORS for preflight)
  app.use(express.json());

  // Compression (skip SSE paths)
  app.use(
    compression({
      filter: (req, res) => {
        if (req.path.includes('/sse/')) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  // Performance monitoring
  app.use(performanceMiddleware);
}

// Re-export express for use in applyGlobalMiddleware
import express from 'express';

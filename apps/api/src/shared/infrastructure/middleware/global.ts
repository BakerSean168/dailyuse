/**
 * Global Middleware Configuration
 *
 * 将原 app.ts 中散落的全局中间件提取为独立模块，
 * 由 ApiBootstrapper 在启动时统一调用。
 */

import type { Express, Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import {
  createPerformanceMiddleware,
  type MetricsStore,
} from '../http/middlewares/performance.middleware';
import { createRequestContextMiddleware } from '../http/middlewares/request-context.middleware';
import { getCorsOrigins, isAllCorsOriginsAllowed } from '../config/env.js';

/**
 * 应用所有全局中间件
 *
 * 包含：RequestContext、Helmet、JSON 解析、Cookie 解析、CORS、Compression、性能监控。
 * RequestContext 必须位于第一个 `app.use`：它在 auth/route/error handler 之前
 * 建立 requestId/traceId/startedAt/source，并先写 `X-Request-Id` 响应头。
 */
export function applyGlobalMiddleware(
  app: Express,
  metricsStore: MetricsStore,
  options: { readonly beforeBodyParsing?: (app: Express) => void } = {},
): void {
  const allowedOrigins = getCorsOrigins();
  const allowAllOrigins = isAllCorsOriginsAllowed();

  // Request metadata producer — must be the very first middleware so JSON,
  // 204, auth failures, 404, 500 and SSE responses share one X-Request-Id.
  app.use(createRequestContextMiddleware());

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
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Skip-Auth',
        'Cache-Control',
        'X-Request-Id',
      ],
      // Expose the correlation header (never auth/internal HMAC headers).
      exposedHeaders: ['X-Request-Id'],
      maxAge: 86400,
    }),
  );

  options.beforeBodyParsing?.(app);

  // JSON body parsing (must be after CORS for preflight)
  app.use(
    express.json({
      limit: '2mb',
      verify(req, _res, buffer) {
        // GitHub signs the exact JSON bytes. Keep them only for signed webhook
        // requests so normal API traffic does not retain a second body copy.
        if (req.headers['x-hub-signature-256']) {
          (req as Request & { rawBody?: string }).rawBody = buffer.toString('utf8');
        }
      },
    }),
  );

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
  app.use(createPerformanceMiddleware(metricsStore));
}

// Re-export express for use in applyGlobalMiddleware
import express from 'express';

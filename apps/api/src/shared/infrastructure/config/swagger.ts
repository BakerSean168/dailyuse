/**
 * @file swagger.ts
 * @description Swagger API 文档配置。
 *
 * 使用 @asteasolutions/zod-to-openapi 生成 OpenAPI 文档，
 * 通过 swagger-ui-express 提供交互式文档界面。
 *
 * 各模块在自己的 `openapi.ts` 中注册 schema 和路径，
 * 此处只负责生成最终文档并挂载 UI。
 *
 * @date 2026-02-20
 */

import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import { createLogger } from '@memoflow/utils/logger';
import { env } from './env';
import { generateOpenApiDocument } from '../openapi/generator';

const logger = createLogger('Swagger');

/**
 * 设置 Swagger UI 中间件。
 *
 * 文档采用懒加载策略：在首次请求时生成并缓存 OpenAPI 文档，
 * 确保所有模块（包括 RouteRegistrar 注册的路由）都已加载完毕。
 *
 * @param app - Express 应用实例
 */
export function setupSwagger(app: Express): void {
  let cachedDocument: ReturnType<typeof generateOpenApiDocument> | null = null;

  function getDocument() {
    if (!cachedDocument) {
      cachedDocument = generateOpenApiDocument();
    }
    return cachedDocument;
  }

  // Swagger UI — 懒加载，首次访问时才生成文档
  app.use('/api/docs', swaggerUi.serve);
  app.get('/api/docs', (req, res, next) => {
    swaggerUi.setup(getDocument(), {
      explorer: true,
      customSiteTitle: 'MemoFlow API 文档',
      swaggerOptions: {
        filter: true,
        showRequestHeaders: true,
        persistAuthorization: true,
      },
    })(req, res, next);
  });

  // OpenAPI JSON 端点
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(getDocument());
  });

  logger.info(`📚 Swagger UI: http://localhost:${env.API_PORT}/api/docs`);
  logger.info(`📄 OpenAPI JSON: http://localhost:${env.API_PORT}/api/docs.json`);
}

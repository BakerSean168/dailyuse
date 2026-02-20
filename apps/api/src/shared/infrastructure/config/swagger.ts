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
import { generateOpenApiDocument } from '../openapi/generator';

/**
 * 设置 Swagger UI 中间件。
 *
 * @param app - Express 应用实例
 */
export function setupSwagger(app: Express): void {
  const openApiDocument = generateOpenApiDocument();

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      explorer: true,
      swaggerOptions: {
        filter: true,
        showRequestHeaders: true,
      },
    }),
  );

  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(openApiDocument);
  });

  console.log('📚 Swagger UI: http://localhost:3888/api/docs');
  console.log('📄 OpenAPI JSON: http://localhost:3888/api/docs.json');
}

/**
 * OpenAPI Document Generator
 *
 * Generates OpenAPI 3.0 document from the registry using @asteasolutions/zod-to-openapi.
 *
 * @module openapi/generator
 */

import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';
import { env } from '../config/env';

/**
 * Generate the complete OpenAPI 3.0 document
 */
export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'DailyUse API',
      description:
        'DailyUse 个人生产力管理平台 REST API 文档。\n\n' +
        '## 认证\n' +
        '大部分 API 需要 Bearer Token 认证。请先通过 `/auth/login` 获取 accessToken。\n\n' +
        '## 响应格式\n' +
        '所有响应遵循统一的 HttpResponse 格式：\n' +
        '- `ok: true` 表示成功，数据在 `data` 字段\n' +
        '- `ok: false` 表示失败，错误信息在 `error` 字段\n',
      contact: {
        name: 'DailyUse Team',
        email: 'support@dailyuse.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.API_PORT}`,
        description: '开发环境',
      },
    ],
    security: [{ bearerAuth: [] }],
  });
}

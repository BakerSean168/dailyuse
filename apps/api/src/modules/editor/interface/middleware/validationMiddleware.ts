/**
 * Zod 验证中间件
 * 提供请求验证功能，支持验证 body、params、query
 */

import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';

/**
 * 验证目标类型
 */
type ValidationTarget = 'body' | 'params' | 'query';

/**
 * 验证错误响应格式
 */
interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * 创建验证中间件
 *
 * @param schema - Zod schema
 * @param target - 验证目标（body/params/query），默认为 'body'
 * @returns Express middleware
 *
 * @example
 * ```typescript
 * router.post(
 *   '/workspaces',
 *   validate(createWorkspaceSchema, 'body'),
 *   EditorWorkspaceController.createWorkspace
 * );
 * ```
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 根据目标选择要验证的数据
      const dataToValidate = req[target];

      // 使用 Zod 验证数据
      const validated = schema.parse(dataToValidate);

      // 将验证后的数据替换原数据（这会自动进行类型转换和默认值填充）
      req[target] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // 格式化 Zod 错误信息
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const errorResponse: ValidationErrorResponse = {
          success: false,
          message: 'Validation failed',
          errors,
        };

        res.status(400).json(errorResponse);
      } else {
        // 其他类型的错误
        res.status(500).json({
          success: false,
          message: 'Internal server error during validation',
        });
      }
    }
  };
}

/**
 * 组合多个验证中间件
 *
 * @example
 * ```typescript
 * router.put(
 *   '/workspaces/:uuid',
 *   validateAll({
 *     params: workspaceUuidParamSchema,
 *     body: updateWorkspaceSchema,
 *   }),
 *   EditorWorkspaceController.updateWorkspace
 * );
 * ```
 */
export function validateAll(schemas: { body?: ZodSchema; params?: ZodSchema; query?: ZodSchema }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 验证 params
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }

      // 验证 query
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }

      // 验证 body
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const errorResponse: ValidationErrorResponse = {
          success: false,
          message: 'Validation failed',
          errors,
        };

        res.status(400).json(errorResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error during validation',
        });
      }
    }
  };
}

/**
 * OpenAPI Response Helpers
 *
 * Standard response envelope builders for OpenAPI documentation.
 * These generate the Zod schemas that describe the HTTP response format
 * used by the expressAdapter.
 *
 * @module @dailyuse/utils/result/openapi-helpers
 *
 * @example
 * ```ts
 * import { successResponse, errorResponse } from '@dailyuse/utils/result';
 *
 * const responses = {
 *   200: successResponse(MyDataSchema, '获取成功'),
 *   404: errorResponse('资源不存在'),
 * };
 * ```
 */

import { z } from 'zod';

// ============================================================================
// Shared Schemas
// ============================================================================

/**
 * Standard error response schema for OpenAPI documentation.
 * Matches the error envelope format produced by expressAdapter.
 */
export const OpenApiErrorResponseSchema = z.object({
  ok: z.literal(false),
  code: z.number(),
  message: z.string(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({
      field: z.string().optional(),
      code: z.string(),
      message: z.string(),
    })).optional(),
  }),
  timestamp: z.number(),
});

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Generate a success response definition wrapping the given data schema.
 * Used in OpenAPI `responses` definitions.
 */
export function successResponse(schema: z.ZodType, description: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: z.object({
          ok: z.literal(true),
          code: z.number(),
          message: z.string(),
          data: schema,
          timestamp: z.number(),
        }),
      },
    },
  };
}

/**
 * Generate an error response definition.
 * Used in OpenAPI `responses` definitions.
 */
export function errorResponse(description: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: OpenApiErrorResponseSchema,
      },
    },
  };
}

/**
 * OpenAPI Registry
 *
 * Central OpenAPI registry instance and common schemas.
 * Each module registers its own schemas and paths in its own `openapi.ts` file,
 * imported via the bootstrap sequence.
 *
 * @module openapi/registry
 */

import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with .openapi() method — must run before any schema registration
extendZodWithOpenApi(z);

// ============================================================================
// Singleton Registry
// ============================================================================

export const registry = new OpenAPIRegistry();

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Standard HTTP response envelope schema
 */
export const HttpResponseSchema = z.object({
  ok: z.boolean().describe('Whether the operation was successful'),
  code: z.number().describe('HTTP status code'),
  message: z.string().describe('Response message'),
  data: z.any().optional().describe('Response data (on success)'),
  error: z.object({
    code: z.string().describe('Error code'),
    message: z.string().describe('Error message'),
    details: z.array(z.object({
      field: z.string().optional().describe('Related field name'),
      code: z.string().describe('Detail error code'),
      message: z.string().describe('Detail error message'),
    })).optional().describe('Validation error details'),
  }).optional().describe('Error information (on failure)'),
  timestamp: z.number().describe('Response timestamp'),
  traceId: z.string().optional().describe('Request trace ID'),
  duration: z.number().optional().describe('Request duration in ms'),
});

registry.register('HttpResponse', HttpResponseSchema);

/**
 * Standard error response
 */
export const ErrorResponseSchema = z.object({
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

registry.register('ErrorResponse', ErrorResponseSchema);

// ============================================================================
// Shared Helpers
// ============================================================================

/**
 * Generate a success response schema wrapping the given data schema.
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
 * Generate an error response schema.
 */
export function errorResponse(description: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  };
}

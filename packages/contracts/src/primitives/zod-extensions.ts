import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Extend Zod with .openapi() method — must run before any schema that uses .openapi()
extendZodWithOpenApi(z);

/**
 * OpenAPI-friendly schema for unknown/any JSON values.
 * Use this instead of raw z.unknown() inside z.record() or other composite types,
 * so that zod-to-openapi can generate a valid OpenAPI document.
 */
export const openApiJsonValue = z.unknown().openapi({ type: 'object' });

/**
 * Creates a Zod schema for a branded ID type.
 *
 * This utility function creates a Zod string schema that validates as a UUID
 * and casts the result to the specified Branded Type <T>.
 *
 * Usage:
 * ```ts
 * import { brandedId } from '@/primitives';
 * import type { GoalId } from '@/primitives';
 *
 * export const CreateGoalSchema = z.object({
 *   id: brandedId<GoalId>(),
 * });
 * ```
 *
 * @param message Optional custom error message for UUID validation
 */
export const brandedId = <T extends string>(message?: string) =>
  z.string().uuid(message) as unknown as z.ZodType<T>;

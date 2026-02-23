/**
 * Setting Registry — Simplified Zod-first validation
 *
 * Uses category Zod schemas for validation instead of per-key SettingDefinition lookup.
 * Only manages the 9 core preference categories.
 */

import { z } from 'zod';
import { CATEGORY_SCHEMAS } from '../preferences/schemas';
import type { PreferenceCategory } from '../preferences/defaults';

/**
 * Validate a partial patch for a given category using the category's Zod schema.
 *
 * @param category - The preference category to validate against
 * @param patch - Partial key-value pairs to validate
 * @returns Validation result with parsed data or error messages
 */
export function validateCategoryPatch(
  category: string,
  patch: Record<string, unknown>,
): { valid: boolean; data?: Record<string, unknown>; error?: string } {
  const schema = CATEGORY_SCHEMAS[category as PreferenceCategory];
  if (!schema) {
    return { valid: false, error: `Unknown setting category: ${category}` };
  }

  const result = (schema as z.ZodObject<z.ZodRawShape>).partial().safeParse(patch);
  if (result.success) {
    return { valid: true, data: result.data as Record<string, unknown> };
  }

  const errorMessages = result.error.issues.map((e: z.ZodIssue) => e.message).join('; ');
  return { valid: false, error: errorMessages };
}

/**
 * Validate a single setting value by key (dot-notation: 'appearance.theme').
 *
 * @param key - Dot-separated key (category.field)
 * @param value - The value to validate
 * @returns Validation result
 */
export function validateSettingValue(
  key: string,
  value: unknown,
): { valid: boolean; error?: string } {
  const dotIndex = key.indexOf('.');
  if (dotIndex === -1) {
    return { valid: false, error: `Invalid setting key format: ${key}` };
  }

  const category = key.substring(0, dotIndex);
  const field = key.substring(dotIndex + 1);

  return validateCategoryPatch(category, { [field]: value });
}

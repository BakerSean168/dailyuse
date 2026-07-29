/**
 * Recursive sensitive field sanitizer for export data.
 *
 * Strips fields whose keys match known sensitive patterns (token, password,
 * secret, apiKey, credential, etc.) from nested objects. Only key names are
 * checked — string values are never inspected to avoid false positives on
 * user-authored content.
 */

import { isBannedPortableDataKey } from '@memoflow/contracts/data-portability';

/**
 * Recursively remove fields whose keys match the sensitive pattern.
 * Returns a new object — the original is not mutated.
 */
export function sanitizeSensitiveFields<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeSensitiveFields(item)) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (isBannedPortableDataKey(key)) {
      continue; // skip sensitive fields
    }
    result[key] = sanitizeSensitiveFields(val);
  }
  return result as T;
}

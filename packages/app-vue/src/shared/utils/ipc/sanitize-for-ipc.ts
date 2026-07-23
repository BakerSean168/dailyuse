/**
 * sanitizeForIpc - Shared renderer-to-IPC serialization boundary
 *
 * Converts Vue reactive proxies (reactive, ref, computed, etc.) into
 * structured-clone-safe plain JavaScript values before they cross the
 * Electron IPC bridge.
 *
 * This utility replaces module-specific ad-hoc de-proxy helpers and
 * provides a single, well-tested serialization boundary for every
 * desktop-bound service call.
 *
 * Responsibilities:
 * - Unwrap Vue proxies via `isProxy()` / `toRaw()`
 * - Unwrap refs via `isRef()` / `unref()`
 * - Recursively clone arrays and plain objects
 * - Preserve primitives, null, Date, RegExp
 * - Strip `undefined` values from object properties for transport stability
 * - Reject obviously unsupported values (functions, symbols) by omitting them
 */

import { isProxy, isRef, toRaw, unref } from 'vue';

/**
 * Recursively converts a Vue reactive value into a plain,
 * structured-clone-safe JavaScript value.
 *
 * @example
 * ```ts
 * const plain = sanitizeForIpc(reactiveFormState);
 * await service.createGoal(plain);
 * ```
 */
export function sanitizeForIpc<T>(value: T): T {
  return deepSanitize(value) as T;
}

function deepSanitize(value: unknown): unknown {
  // 1. Handle null / undefined
  if (value === null || value === undefined) {
    return value;
  }

  // 2. Unwrap Vue refs first
  if (isRef(value)) {
    return deepSanitize(unref(value));
  }

  // 3. Primitives pass through
  if (typeof value !== 'object' && typeof value !== 'function') {
    return value;
  }

  // 4. Skip functions and symbols
  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  // 5. Unwrap Vue proxies
  const raw = isProxy(value) ? toRaw(value) : value;

  // 6. Date — clone to avoid reference sharing
  if (raw instanceof Date) {
    return new Date(raw.getTime());
  }

  // 7. RegExp — clone
  if (raw instanceof RegExp) {
    return new RegExp(raw.source, raw.flags);
  }

  // 8. Arrays — recursively sanitize each element
  if (Array.isArray(raw)) {
    return raw.map((item) => deepSanitize(item));
  }

  // 9. Plain objects — recursively sanitize, stripping undefined values
  if (isPlainObject(raw)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
      const sanitized = deepSanitize(val);
      // Strip undefined fields for transport stability
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }
    return result;
  }

  // 10. Other objects (class instances, etc.) — attempt shallow clone via spread
  //     This handles cases like domain DTOs that are class instances
  try {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
      const sanitized = deepSanitize(val);
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }
    return result;
  } catch {
    // If all else fails, return the raw value and let structured clone
    // report a clear error rather than silently dropping data
    return raw;
  }
}

/**
 * Residual 1139 keep-boundary: prototype-strict plain object guard for IPC sanitize.
 * Accepts only Object.prototype / null-proto objects (rejects arrays + class instances).
 * Soft residual 1139: AI isRecord (!Array) and desktop isRecord (arrays allowed) stay separate.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

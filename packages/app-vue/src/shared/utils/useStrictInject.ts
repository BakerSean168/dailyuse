/**
 * Strict inject — wraps Vue's inject() with a runtime guard.
 *
 * Returns `T` (not `T | undefined`) so callers never need null checks.
 * Throws immediately if the key hasn't been provided by a parent.
 */

import { inject, type InjectionKey } from 'vue';

export function useStrictInject<T>(key: InjectionKey<T>, name?: string): T {
  const value = inject(key);
  if (value === undefined) {
    throw new Error(`[app-vue] Missing injection: ${name ?? key.toString()}`);
  }
  return value;
}

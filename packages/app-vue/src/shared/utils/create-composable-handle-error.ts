/**
 * Residual 973: sole createComposableHandleError factory for app-vue composables.
 * schedule / notification / reminder / setting import this (console.error report path);
 * local duals retired.
 * Soft residual: task composables keep toast.error report path — keep-boundary until a
 * dedicated residual elevates that variant via the optional report hook.
 */

import type { ResultErrorTranslateFn } from '@dailyuse/http-client';
import { translateResultError } from './translate-result-error';

export interface ComposableHandleErrorOptions {
  t: ResultErrorTranslateFn;
  setError: (message: string | null) => void;
  /** Defaults to console.error(message). Toast/other reporters pass custom handlers. */
  report?: (message: string) => void;
}

/**
 * Build a composable-local handleError(error, fallbackKey) that translates Result errors,
 * writes store error state, and reports the message.
 */
export function createComposableHandleError(
  options: ComposableHandleErrorOptions,
): (error: unknown, fallbackKey: string) => void {
  const report = options.report ?? ((message: string) => {
    console.error(message);
  });

  return function handleError(error: unknown, fallbackKey: string): void {
    const message = translateResultError(error, options.t, { fallbackKey });
    options.setError(message);
    report(message);
  };
}

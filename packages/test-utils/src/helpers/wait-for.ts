/**
 * Async condition waiting utility
 *
 * Repeatedly checks a condition function until it returns true or a timeout expires.
 * Useful for testing eventual consistency, async state changes, or polling scenarios.
 */

export interface WaitForOptions {
  /** Maximum time to wait in milliseconds (default: 5000) */
  timeout?: number;
  /** Polling interval in milliseconds (default: 50) */
  interval?: number;
  /** Custom error message on timeout */
  message?: string;
}

/**
 * Wait for a condition to become true
 *
 * @param condition - Async or sync function that returns true when the condition is met
 * @param options - Timeout and polling configuration
 * @throws Error if the condition is not met within the timeout
 *
 * @example
 * ```typescript
 * await waitFor(async () => {
 *   const goal = await goalService.findById(goalId);
 *   return goal.status === 'COMPLETED';
 * }, { timeout: 5000 });
 * ```
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: WaitForOptions = {},
): Promise<void> {
  const { timeout = 5000, interval = 50, message } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await condition();
      if (result) return;
    } catch {
      // Condition threw — treat as "not yet met", keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(message ?? `waitFor timed out after ${timeout}ms`);
}

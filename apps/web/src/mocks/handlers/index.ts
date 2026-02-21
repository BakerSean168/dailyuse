/**
 * MSW Handlers - Aggregated Export
 *
 * Combine all module handlers in one array for use with `setupWorker`.
 *
 * @example
 * ```ts
 * import { handlers } from './handlers';
 * const worker = setupWorker(...handlers);
 * ```
 */

import { goalHandlers } from './goal.handlers';
import { accountHandlers } from './account.handlers';
import { authHandlers } from './auth.handlers';

export const handlers = [
  ...goalHandlers,
  ...accountHandlers,
  ...authHandlers,
];

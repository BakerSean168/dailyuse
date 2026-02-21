/**
 * MSW Browser Worker Setup
 *
 * Creates and exports a Service Worker instance pre-loaded with all
 * mock handlers.  Import and call `worker.start()` in your app entry
 * point when running in development mode.
 *
 * @example
 * ```ts
 * // main.ts
 * if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_API === 'true') {
 *   const { worker } = await import('./mocks/browser');
 *   await worker.start({ onUnhandledRequest: 'bypass' });
 * }
 * ```
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

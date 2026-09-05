/**
 * Browser-generated ResizeObserver loop notifications are delivered through the
 * global `error` event even though they do not represent an uncaught application
 * exception. Treat only the exact browser messages without an attached exception
 * as non-fatal so real renderer failures keep using the Desktop startup boundary.
 */
const NON_FATAL_RESIZE_OBSERVER_MESSAGES = new Set([
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded',
]);

export interface RendererErrorEventLike {
  readonly message: string;
  readonly error?: unknown;
}

export function isNonFatalResizeObserverNotification(event: RendererErrorEventLike): boolean {
  return event.error == null && NON_FATAL_RESIZE_OBSERVER_MESSAGES.has(event.message);
}

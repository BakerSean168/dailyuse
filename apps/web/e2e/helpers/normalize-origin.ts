/**
 * Residual 1027: sole origin trailing-slash strip for web Playwright e2e bootstrap.
 * Exact dual retired from playwright.server.ts + e2e/helpers/start-api-server.ts.
 */

export function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '');
}

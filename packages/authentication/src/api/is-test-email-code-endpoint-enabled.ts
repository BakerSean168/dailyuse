/**
 * Gate for the test-only `/auth/test/last-email-code` endpoint.
 *
 * Enabled when:
 * - NODE_ENV=test (unit/integration), or
 * - RUNTIME_LANE=e2e (Playwright host lane), or
 * - LOCAL_VALIDATION=1 (local Docker compose prod-like stack only)
 *
 * Must stay off for generic production / release images unless the
 * local-compose file explicitly injects LOCAL_VALIDATION=1.
 */
export function isTestEmailCodeEndpointEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  if (env.NODE_ENV === 'test') return true;
  if (env.RUNTIME_LANE === 'e2e') return true;
  if (env.LOCAL_VALIDATION === '1' || env.LOCAL_VALIDATION === 'true') return true;
  return false;
}

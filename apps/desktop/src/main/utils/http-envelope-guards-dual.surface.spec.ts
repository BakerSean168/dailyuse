import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hasDataKey, isRecord } from './http-envelope-guards';

/**
 * Residual 947: desktop remote-gateway isRecord/hasDataKey duals retired.
 * Sole bodies in http-envelope-guards.ts; auth + knowledge gateways import them.
 * Soft residual 945: formatZodErrors dual retired
 *   (packages/utils/src/result/format-zod-errors-dual.surface.spec.ts).
 * Soft residual 949: maskEmail dual retired
 *   (packages/authentication/src/server/shared/mask-email-dual.surface.spec.ts).
 * Keep-boundary: AuthHttpEnvelope ≠ knowledge HttpEnvelope payload shapes.
 * Soft residual 1089: app-vue AI isRecord plain-object keep-boundary surface (no force-merge).
 * Does not flip §13.2 checkboxes.
 */
describe('http envelope guards dual retired (residual 947)', () => {
  const utilsDir = __dirname;
  const sole = readFileSync(resolve(utilsDir, 'http-envelope-guards.ts'), 'utf8');
  const authGateway = readFileSync(
    resolve(utilsDir, '../modules/authentication/application/auth-remote-gateway.ts'),
    'utf8',
  );
  const knowledgeGateway = readFileSync(
    resolve(utilsDir, '../modules/repository/knowledge-repository-remote.gateway.ts'),
    'utf8',
  );
  const index = readFileSync(resolve(utilsDir, 'index.ts'), 'utf8');

  it('owns sole isRecord/hasDataKey helper bodies', () => {
    expect(sole).toContain('Residual 947');
    expect(sole).toMatch(/export function isRecord\b/);
    expect(sole).toMatch(/export function hasDataKey\b/);
    expect(sole).toContain("value !== null && typeof value === 'object'");
    expect(sole).toContain("'data' in body");
    expect(index).toContain('Residual 947');
    expect(index).toContain("export { isRecord, hasDataKey } from './http-envelope-guards'");
  });

  it('auth and knowledge gateways import sole helpers without local dual bodies', () => {
    expect(authGateway).toContain('Residual 947');
    expect(authGateway).toContain(
      "import { hasDataKey, isRecord } from '../../../utils/http-envelope-guards'",
    );
    expect(authGateway).not.toMatch(/function isRecord\b/);
    expect(authGateway).not.toMatch(/function hasDataKey\b/);
    // Auth envelope keep-boundary remains local
    expect(authGateway).toMatch(/type AuthHttpEnvelope\b/);

    expect(knowledgeGateway).toContain('Residual 947');
    expect(knowledgeGateway).toContain(
      "import { hasDataKey, isRecord } from '../../utils/http-envelope-guards'",
    );
    expect(knowledgeGateway).not.toMatch(/function isRecord\b/);
    expect(knowledgeGateway).not.toMatch(/function hasDataKey\b/);
    // Knowledge envelope keep-boundary remains local
    expect(knowledgeGateway).toMatch(/interface HttpEnvelope\b/);
  });

  it('type-guards behave for envelope-shaped and non-object values', () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(true);
    expect(isRecord({ ok: true })).toBe(true);
    expect(hasDataKey({ ok: true })).toBe(false);
    expect(hasDataKey({ ok: true, data: { id: '1' } })).toBe(true);
    expect(hasDataKey('nope')).toBe(false);
  });
});

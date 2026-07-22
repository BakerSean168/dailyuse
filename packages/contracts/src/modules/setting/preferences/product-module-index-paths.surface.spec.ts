import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 331: product module-index markdown must not link to deleted
 * domain-server / application-server / infrastructure-server / controllers paths.
 * Residual 335: authentication-files.md must not claim OAuth is callback-only skeleton.
 */
describe('product module-index path integrity surface', () => {
  const repoRoot = resolve(__dirname, '../../../../../../');
  const indexDir = resolve(repoRoot, 'docs/product/module-index');

  it('all packages/apps/docs file links in module-index exist on disk', () => {
    const files = readdirSync(indexDir).filter((name) => name.endsWith('.md'));
    expect(files.length).toBeGreaterThan(5);

    const missing: string[] = [];
    const legacy: string[] = [];
    for (const name of files) {
      const text = readFileSync(resolve(indexDir, name), 'utf8');
      if (
        text.includes('/src/domain-server/') ||
        text.includes('/src/application-server/') ||
        text.includes('/src/infrastructure-server/') ||
        text.includes('/src/controllers/')
      ) {
        legacy.push(name);
      }
      const paths = [...text.matchAll(/\[`((?:packages|apps|docs)\/[^`]+)`\]/g)].map((m) => m[1]);
      for (const rel of paths) {
        if (!existsSync(resolve(repoRoot, rel))) {
          missing.push(`${name}: ${rel}`);
        }
      }
    }

    expect(legacy).toEqual([]);
    expect(missing).toEqual([]);
  });

  it('authentication-files.md locks ADR-034 OAuth identity production paths (residual 335)', () => {
    const authIndex = readFileSync(resolve(indexDir, 'authentication-files.md'), 'utf8');
    // Stale "skeleton only" claims must not return.
    expect(authIndex).not.toContain('只完成服务端 callback 骨架');
    expect(authIndex).not.toContain('仍未接线');
    expect(authIndex).not.toContain('没有授权发起与 state/PKCE');
    // Production OAuth identity path + identity-only scopes.
    expect(authIndex).toContain('identity-only scopes');
    expect(authIndex).toContain('read:user');
    expect(authIndex).toContain('user:email');
    expect(authIndex).toContain(
      'packages/authentication/src/server/application/use-cases/commands/get-oauth-url.use-case.ts',
    );
    expect(authIndex).toContain(
      'packages/authentication/src/server/domain/services/providers/github-authentication.provider.ts',
    );
    expect(authIndex).toContain('apps/web/src/auth/WebAuthView.vue');
    expect(authIndex).toContain(
      'packages/app-vue/src/views/three-login-surface.matrix.spec.ts',
    );
    // Knowledge-repo App stays on repository transport, not login OAuth.
    expect(authIndex).toContain(
      'packages/repository/src/api/routes/knowledge-repository-connection.routes.ts',
    );
    expect(authIndex).toContain('knowledge-connection');
    expect(authIndex).toContain('repo Contents');
  });
});

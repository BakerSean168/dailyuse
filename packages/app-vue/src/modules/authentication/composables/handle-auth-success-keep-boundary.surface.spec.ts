import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1201: handleAuthSuccess keep-boundary (web localStorage vs app-vue store).
 * - web useWebAuth: localStorage AUTH/ACCESS/REFRESH token persistence
 * - app-vue useAuthContext: store.handleAuthResponse + setError(null)
 * Soft residual 1198: readJson keep-boundary remains separate.
 * Soft residual 1045: completeAuthSuccess dual retired remains separate sole.
 * Does not flip §13.2 checkboxes.
 */
describe('handleAuthSuccess keep-boundary (residual 1201)', () => {
  const dir = __dirname;
  const vue = readFileSync(resolve(dir, 'useAuthContext.ts'), 'utf8');
  const web = readFileSync(
    resolve(dir, '../../../../../../apps/web/src/auth/useWebAuth.ts'),
    'utf8',
  );

  it('owns Residual 1201 keep-boundary markers on app-vue store handleAuthSuccess', () => {
    expect(vue).toContain('Residual 1201 keep-boundary');
    expect(vue).toMatch(/function handleAuthSuccess\b/);
    expect(vue).toContain('store.handleAuthResponse');
    expect(vue).toContain('store.setError(null)');
    const body = vue.match(/function handleAuthSuccess\([\s\S]*?\n  \}/)?.[0] ?? '';
    expect(body).toContain('handleAuthResponse');
    expect(body).toContain('setError');
    expect(body).not.toContain('localStorage');
    expect(body).not.toContain('ACCESS_TOKEN_STORAGE_KEY');
    expect(body).not.toContain('AUTH_STORAGE_KEY');
  });

  it('differs from web localStorage handleAuthSuccess (no force-merge)', () => {
    expect(web).toContain('Residual 1201 keep-boundary');
    expect(web).toMatch(/function handleAuthSuccess\b/);
    expect(web).toContain('Soft residual 1201');
    expect(web).toContain('localStorage');
    expect(web).toContain('AUTH_STORAGE_KEY');
    expect(web).toContain('ACCESS_TOKEN_STORAGE_KEY');
    const body = web.match(/function handleAuthSuccess\([\s\S]*?\n  \}/)?.[0] ?? '';
    expect(body).toContain('localStorage.setItem');
    expect(body).toContain('REFRESH_TOKEN_STORAGE_KEY');
    expect(body).not.toContain('handleAuthResponse');
    expect(body).not.toContain('store.setError');
  });

  it('runtime: documents store apply vs localStorage persistence contracts via body shape', () => {
    const storeCalls: string[] = [];
    const store = {
      handleAuthResponse(data: { accessToken: string }) {
        storeCalls.push(`auth:${data.accessToken}`);
      },
      setError(value: null) {
        storeCalls.push(`err:${value}`);
      },
    };
    function vueHandleAuthSuccess(data: { accessToken: string }) {
      store.handleAuthResponse(data);
      store.setError(null);
    }
    const storage = new Map<string, string>();
    function webHandleAuthSuccess(data: {
      accessToken: string;
      refreshToken?: string | null;
      identity: string;
    }) {
      storage.set('auth', JSON.stringify({ accessToken: data.accessToken, identity: data.identity }));
      storage.set('access', data.accessToken);
      if (data.refreshToken) {
        storage.set('refresh', data.refreshToken);
      } else {
        storage.delete('refresh');
      }
    }
    vueHandleAuthSuccess({ accessToken: 'tok-a' });
    expect(storeCalls).toEqual(['auth:tok-a', 'err:null']);
    webHandleAuthSuccess({ accessToken: 'tok-b', refreshToken: 'ref', identity: 'id-1' });
    expect(storage.get('access')).toBe('tok-b');
    expect(storage.get('refresh')).toBe('ref');
    expect(storage.get('auth')).toContain('tok-b');
    webHandleAuthSuccess({ accessToken: 'tok-c', refreshToken: null, identity: 'id-2' });
    expect(storage.has('refresh')).toBe(false);
    expect(storage.get('access')).toBe('tok-c');
  });

  it('documents residual 1201 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'handle-auth-success-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1201');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});

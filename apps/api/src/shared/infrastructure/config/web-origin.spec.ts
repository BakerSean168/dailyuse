import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deriveWebOrigin, getTrustedWebOrigins } from './web-origin.js';

/**
 * O2V-01: the MagicDNS public Web origin is auto-included in the API trusted
 * origins (server.ts trustedOrigins) and the API CORS middleware (global.ts)
 * WITHOUT touching the getCorsOrigins() keep-boundary (residual 1189).
 */

describe('deriveWebOrigin', () => {
  it('strips the trailing path from a MagicDNS Web URL', () => {
    expect(
      deriveWebOrigin('http://oracle.taile92a8e.ts.net:58080/auth/verify'),
    ).toBe('http://oracle.taile92a8e.ts.net:58080');
  });

  it('keeps an already-origin URL unchanged', () => {
    expect(deriveWebOrigin('https://app.example.com')).toBe('https://app.example.com');
  });

  it('returns undefined when MEMOFLOW_WEB_URL is unset', () => {
    expect(deriveWebOrigin(undefined)).toBeUndefined();
    expect(deriveWebOrigin('')).toBeUndefined();
  });

  it('returns undefined for an unparseable URL', () => {
    expect(deriveWebOrigin('not a url')).toBeUndefined();
  });
});

describe('getTrustedWebOrigins', () => {
  it('appends the MEMOFLOW_WEB_URL-derived origin to the CORS list', () => {
    expect(
      getTrustedWebOrigins(
        ['http://localhost:58080', 'http://127.0.0.1:58080'],
        'http://oracle.taile92a8e.ts.net:58080',
      ),
    ).toEqual([
      'http://localhost:58080',
      'http://127.0.0.1:58080',
      'http://oracle.taile92a8e.ts.net:58080',
    ]);
  });

  it('dedupes an origin already present in the CORS list', () => {
    expect(
      getTrustedWebOrigins(
        ['http://localhost:58080', 'http://oracle.taile92a8e.ts.net:58080'],
        'http://oracle.taile92a8e.ts.net:58080/',
      ),
    ).toEqual(['http://localhost:58080', 'http://oracle.taile92a8e.ts.net:58080']);
  });

  it('returns the CORS list unchanged when MEMOFLOW_WEB_URL is unset', () => {
    const base = ['http://localhost:58080', 'http://127.0.0.1:58080'];
    expect(getTrustedWebOrigins(base, undefined)).toEqual(base);
  });

  it('does not mutate the input list', () => {
    const base = ['http://localhost:58080'];
    const result = getTrustedWebOrigins(
      base,
      'http://oracle.taile92a8e.ts.net:58080',
    );
    expect(result).not.toBe(base);
    expect(base).toEqual(['http://localhost:58080']);
  });

  it('ignores an invalid MEMOFLOW_WEB_URL', () => {
    const base = ['http://localhost:58080'];
    expect(getTrustedWebOrigins(base, 'not a url')).toEqual(base);
  });
});

describe('O2V-01 machine-public URL wiring', () => {
  it('server.ts trustedOrigins is derived via getTrustedWebOrigins + MEMOFLOW_WEB_URL', () => {
    const server = readFileSync(resolve(__dirname, '../../../server.ts'), 'utf8');
    expect(server).toContain('getTrustedWebOrigins');
    expect(server).toContain('env.MEMOFLOW_WEB_URL');
    expect(server).toContain("from './shared/infrastructure/config/web-origin.js'");
  });

  it('global.ts CORS allowedOrigins includes the derived WEB origin', () => {
    const globalMiddleware = readFileSync(
      resolve(__dirname, '../middleware/global.ts'),
      'utf8',
    );
    expect(globalMiddleware).toContain('getTrustedWebOrigins');
    expect(globalMiddleware).toContain('env.MEMOFLOW_WEB_URL');
  });
});
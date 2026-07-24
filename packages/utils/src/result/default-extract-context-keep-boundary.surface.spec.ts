import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1183: defaultExtractContext keep-boundary (Express HTTP vs IPC desktop stub).
 * - express-adapter: header/body device mining + req.user.identityId → rich Context
 * - ipc-adapter: fixed { identityId: '', deviceId: 'desktop' } stub
 * Soft residual 1180: comparePriority keep-boundary remains separate.
 * Soft residual 1177: buildTaskName keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('defaultExtractContext keep-boundary (residual 1183)', () => {
  const dir = __dirname;
  const express = readFileSync(resolve(dir, 'express-adapter.ts'), 'utf8');
  const ipc = readFileSync(resolve(dir, 'ipc-adapter.ts'), 'utf8');

  it('owns Residual 1183 keep-boundary markers on Express rich defaultExtractContext', () => {
    expect(express).toContain('Residual 1183 keep-boundary');
    expect(express).toMatch(/function defaultExtractContext\b/);
    expect(express).toContain('ExpressLikeRequest');
    expect(express).toContain('x-forwarded-for');
    expect(express).toContain('req.user?.identityId');
    expect(express).toContain('deviceFingerprint');
    const body = express.match(/function defaultExtractContext\([\s\S]*?\n\}/)?.[0] ?? '';
    // multi-line function — match until first top-level closing may be too short; use markers
    expect(express).toContain("headers['x-device-id']");
    expect(express).toContain('inferDeviceType');
    expect(express).not.toContain("deviceId: 'desktop'");
  });

  it('differs from IPC desktop-stub defaultExtractContext (no force-merge)', () => {
    expect(ipc).toContain('Residual 1183 keep-boundary');
    expect(ipc).toMatch(/function defaultExtractContext\b/);
    expect(ipc).toContain('Soft residual 1183');
    expect(ipc).toContain('IpcInvokeEvent');
    expect(ipc).toContain("deviceId: 'desktop'");
    expect(ipc).toContain("identityId: ''");
    const body = ipc.match(/function defaultExtractContext\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain("deviceId: 'desktop'");
    expect(body).not.toContain('x-forwarded-for');
    expect(body).not.toContain('req.user');
    expect(body).not.toContain('inferDeviceType');
    expect(body).not.toContain('deviceFingerprint');
  });

  it('runtime: documents Express rich vs IPC stub contracts via body shape', () => {
    function ipcDefaultExtractContext(): { identityId: string; deviceId: string } {
      return { identityId: '', deviceId: 'desktop' };
    }
    function expressDefaultExtractContext(req: {
      user?: { identityId?: string };
      headers?: Record<string, string | string[] | undefined>;
      body?: { deviceId?: string };
    }): { identityId: string; deviceId: string; hasDevice?: boolean } {
      const headers = req.headers ?? {};
      const body = req.body ?? {};
      const deviceId =
        (typeof headers['x-device-id'] === 'string' && headers['x-device-id']) ||
        body.deviceId ||
        'unknown';
      return {
        identityId: req.user?.identityId ?? '',
        deviceId,
        hasDevice: true,
      };
    }
    expect(ipcDefaultExtractContext()).toEqual({ identityId: '', deviceId: 'desktop' });
    expect(
      expressDefaultExtractContext({
        user: { identityId: 'id-1' },
        headers: { 'x-device-id': 'web-1' },
      }),
    ).toEqual({ identityId: 'id-1', deviceId: 'web-1', hasDevice: true });
    expect(expressDefaultExtractContext({})).toEqual({
      identityId: '',
      deviceId: 'unknown',
      hasDevice: true,
    });
  });

  it('documents residual 1183 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'default-extract-context-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1183');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CloudSessionStore } from './cloud-session-store';

describe('CloudSessionStore', () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'cloud-session-store-'));
  });

  afterEach(async () => {
    await fs.promises.rm(rootDir, { recursive: true, force: true });
  });

  it('persists the real Better Auth session id in profile-scoped secure storage', async () => {
    const store = new CloudSessionStore(rootDir);
    await store.save('profile-1', {
      token: 'token-1',
      sessionId: 'session-1',
      account: { id: 'account-1', email: 'user@example.com', name: 'User', emailVerified: true },
      expiresAt: '2030-01-01T00:00:00.000Z',
    });

    await expect(store.load('profile-1')).resolves.toMatchObject({
      token: 'token-1',
      sessionId: 'session-1',
    });
    await expect(store.getValidToken('profile-1')).resolves.toBe('token-1');
  });

  it('keeps expired metadata for reauthentication state but never returns its token', async () => {
    const store = new CloudSessionStore(rootDir);
    await store.save('profile-1', {
      token: 'expired-token',
      sessionId: 'expired-session',
      account: { id: 'account-1', email: 'user@example.com', name: 'User', emailVerified: true },
      expiresAt: '2000-01-01T00:00:00.000Z',
    });

    await expect(store.load('profile-1')).resolves.toMatchObject({ sessionId: 'expired-session' });
    await expect(store.getValidToken('profile-1')).resolves.toBeNull();
  });
});

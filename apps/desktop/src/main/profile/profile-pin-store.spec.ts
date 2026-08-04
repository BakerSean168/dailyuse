import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProfilePinStore } from './profile-pin-store';

describe('ProfilePinStore', () => {
  let rootDir: string;
  let store: ProfilePinStore;

  beforeEach(async () => {
    rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'profile-pin-'));
    store = new ProfilePinStore(rootDir);
  });

  afterEach(async () => fs.promises.rm(rootDir, { recursive: true, force: true }));

  it('wraps and unwraps the same Profile key with Argon2id and AES-GCM', async () => {
    const profileKey = Buffer.alloc(32, 7);
    await store.setPin('profile-1', '123456', profileKey);

    expect(await store.hasPin('profile-1')).toBe(true);
    expect(await store.unlock('profile-1', '123456')).toEqual(profileKey);
  });

  it('rejects an incorrect PIN without modifying the envelope', async () => {
    await store.setPin('profile-1', '123456', Buffer.alloc(32, 9));
    await expect(store.unlock('profile-1', '654321')).rejects.toThrow('PIN 不正确');
    expect(await store.unlock('profile-1', '123456')).toEqual(Buffer.alloc(32, 9));
  });

  it('requires a numeric PIN between 6 and 12 digits', async () => {
    await expect(store.setPin('profile-1', '1234', Buffer.alloc(32))).rejects.toThrow('6 至 12');
  });
});

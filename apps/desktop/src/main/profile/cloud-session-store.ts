import fs from 'node:fs';
import path from 'node:path';
import { safeStorage } from 'electron';

export interface StoredCloudSession {
  token: string;
  sessionId: string;
  account: { id: string; email: string; name: string; emailVerified: boolean };
  expiresAt: string;
}

export class CloudSessionStore {
  private readonly directory: string;

  constructor(rootDir: string) {
    this.directory = path.join(rootDir, 'shared', 'secure', 'cloud-sessions');
  }

  async save(profileId: string, session: StoredCloudSession): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('本机安全存储不可用');
    await fs.promises.mkdir(this.directory, { recursive: true });
    const encrypted = safeStorage.encryptString(JSON.stringify(session));
    const target = path.join(this.directory, `${profileId}.bin`);
    const temp = `${target}.tmp`;
    await fs.promises.writeFile(temp, encrypted);
    await fs.promises.rename(temp, target);
  }

  async load(profileId: string): Promise<StoredCloudSession | null> {
    try {
      if (!safeStorage.isEncryptionAvailable()) return null;
      const encrypted = await fs.promises.readFile(path.join(this.directory, `${profileId}.bin`));
      return JSON.parse(safeStorage.decryptString(encrypted)) as StoredCloudSession;
    } catch {
      return null;
    }
  }

  async getValidToken(profileId: string): Promise<string | null> {
    const session = await this.load(profileId);
    if (!session) return null;
    if (Date.parse(session.expiresAt) <= Date.now()) return null;
    return session.token;
  }

  async remove(profileId: string): Promise<void> {
    await fs.promises.rm(path.join(this.directory, `${profileId}.bin`), { force: true });
  }
}

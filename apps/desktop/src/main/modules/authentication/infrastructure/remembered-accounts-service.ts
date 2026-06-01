import { app, safeStorage } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

import type { IdentityId } from '@dailyuse/contracts/authentication';
import { IdentityId as IdentityIdValue } from '@dailyuse/domain-shared';
import { createLogger } from '@dailyuse/utils/logger';
import type { ILogger } from '@dailyuse/utils/logger';

export interface RememberedAccountRecord {
  identityId: IdentityId;
  identifier: string;
  nickname: string | null;
  avatarUrl: string | null;
  rememberPassword: boolean;
  autoLogin: boolean;
  lastUsedAt: number;
  lastLoginAt: number;
  /** Base64-encoded safeStorage-encrypted password (only when rememberPassword is true) */
  encryptedPassword?: string;
}

interface SerializedRememberedAccountRecord {
  identityId: string;
  identifier: string;
  nickname: string | null;
  avatarUrl: string | null;
  rememberPassword: boolean;
  autoLogin: boolean;
  lastUsedAt: number;
  lastLoginAt: number;
  encryptedPassword?: string;
}

interface RememberedAccountsFile {
  accounts: RememberedAccountRecord[];
}

interface SerializedRememberedAccountsFile {
  accounts: SerializedRememberedAccountRecord[];
}

interface RecordLoginInput {
  identityId: IdentityId;
  identifier: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  rememberPassword: boolean;
  autoLogin: boolean;
  /** Plaintext password to encrypt and store (only when rememberPassword is true) */
  password?: string;
}

const DEFAULT_FILE: RememberedAccountsFile = { accounts: [] };

function toIdentityId(value: string | IdentityId): IdentityId {
  return IdentityIdValue.of(String(value));
}

export class RememberedAccountsService {
  private readonly logger: ILogger;
  private filePath: string;
  private cache: RememberedAccountsFile | null = null;

  constructor(logger?: ILogger) {
    this.logger = logger ?? createLogger('RememberedAccounts');
    this.filePath = path.join(app.getPath('userData'), 'auth', 'remembered-accounts.json');
  }

  /**
   * Set the file path for remembered accounts storage.
   * Clears the cache so the next read loads from the new path.
   * Must be called before any read/write operations when using multi-profile architecture.
   */
  setFilePath(filePath: string): void {
    this.filePath = filePath;
    this.cache = null;
    this.logger.info('Remembered accounts file path updated', { filePath });
  }

  async list(): Promise<RememberedAccountRecord[]> {
    const data = await this.read();
    return [...data.accounts].sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  }

  async getAutoLoginAccount(): Promise<RememberedAccountRecord | null> {
    const accounts = await this.list();
    return accounts.find((account) => account.autoLogin) ?? null;
  }

  async recordLogin(input: RecordLoginInput): Promise<void> {
    const data = await this.read();
    const now = Date.now();

    // Encrypt password if rememberPassword is true and password is provided
    let encryptedPassword: string | undefined;
    if (input.rememberPassword && input.password && safeStorage.isEncryptionAvailable()) {
      encryptedPassword = safeStorage.encryptString(input.password).toString('base64');
    }

    const next: RememberedAccountRecord = {
      identityId: input.identityId,
      identifier: input.identifier.trim(),
      nickname: input.nickname?.trim() || this.buildFallbackNickname(input.identifier),
      avatarUrl: input.avatarUrl ?? null,
      rememberPassword: input.rememberPassword,
      autoLogin: input.autoLogin,
      lastUsedAt: now,
      lastLoginAt: now,
      encryptedPassword,
    };

    const remaining = data.accounts.filter((account) => account.identityId !== input.identityId);
    const accounts = [next, ...remaining].map((account) => {
      if (!next.autoLogin || account.identityId === next.identityId) {
        return account;
      }
      return { ...account, autoLogin: false };
    });

    await this.write({ accounts });
  }

  async updateProfile(
    identityId: string | IdentityId,
    profile: { nickname?: string | null; avatarUrl?: string | null },
  ): Promise<void> {
    const data = await this.read();
    const normalizedIdentityId = toIdentityId(identityId);
    const accounts = data.accounts.map((account) =>
      account.identityId === normalizedIdentityId
        ? {
            ...account,
            nickname:
              profile.nickname === undefined ? account.nickname : (profile.nickname ?? null),
            avatarUrl:
              profile.avatarUrl === undefined ? account.avatarUrl : (profile.avatarUrl ?? null),
          }
        : account,
    );
    await this.write({ accounts });
  }

  async remove(identityId: string | IdentityId): Promise<void> {
    const data = await this.read();
    const normalizedIdentityId = toIdentityId(identityId);
    const accounts = data.accounts.filter((account) => account.identityId !== normalizedIdentityId);
    await this.write({ accounts });
  }

  /**
   * Decrypt the stored password for a remembered account.
   * Returns null if no encrypted password is stored or decryption fails.
   */
  decryptPassword(account: RememberedAccountRecord): string | null {
    if (!account.encryptedPassword || !safeStorage.isEncryptionAvailable()) {
      return null;
    }
    try {
      const buffer = Buffer.from(account.encryptedPassword, 'base64');
      return safeStorage.decryptString(buffer);
    } catch {
      this.logger.warn('Failed to decrypt password for account', {
        identityId: String(account.identityId),
      });
      return null;
    }
  }

  private async read(): Promise<RememberedAccountsFile> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as SerializedRememberedAccountsFile;
      this.cache = {
        accounts: Array.isArray(parsed.accounts)
          ? parsed.accounts.map((account) => ({
              ...account,
              identityId: toIdentityId(account.identityId),
            }))
          : [],
      };
      return this.cache;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        this.logger.warn('Failed to read remembered accounts, resetting', { error });
      }
      this.cache = { ...DEFAULT_FILE };
      return this.cache;
    }
  }

  private async write(data: RememberedAccountsFile): Promise<void> {
    this.cache = data;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const serialized: SerializedRememberedAccountsFile = {
      accounts: data.accounts.map((account) => ({
        ...account,
        identityId: String(account.identityId),
      })),
    };
    await fs.writeFile(this.filePath, JSON.stringify(serialized, null, 2), 'utf8');
  }

  private buildFallbackNickname(identifier: string): string {
    const value = identifier.trim();
    if (!value) {
      return 'Desktop User';
    }
    const atIndex = value.indexOf('@');
    if (atIndex > 0) {
      return value.slice(0, atIndex);
    }
    return value;
  }
}

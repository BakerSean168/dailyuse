import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

import { createLogger, type ILogger } from '@dailyuse/utils';

export interface RememberedAccountRecord {
  identityId: string;
  identifier: string;
  nickname: string | null;
  avatarUrl: string | null;
  rememberPassword: boolean;
  autoLogin: boolean;
  lastUsedAt: number;
  lastLoginAt: number;
}

interface RememberedAccountsFile {
  accounts: RememberedAccountRecord[];
}

interface RecordLoginInput {
  identityId: string;
  identifier: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  rememberPassword: boolean;
  autoLogin: boolean;
}

const DEFAULT_FILE: RememberedAccountsFile = { accounts: [] };

export class RememberedAccountsService {
  private static instance: RememberedAccountsService | null = null;

  private readonly logger: ILogger;
  private readonly filePath: string;
  private cache: RememberedAccountsFile | null = null;

  private constructor(logger?: ILogger) {
    this.logger = logger ?? createLogger('RememberedAccounts');
    this.filePath = path.join(app.getPath('userData'), 'auth', 'remembered-accounts.json');
  }

  static getInstance(logger?: ILogger): RememberedAccountsService {
    if (!RememberedAccountsService.instance) {
      RememberedAccountsService.instance = new RememberedAccountsService(logger);
    }
    return RememberedAccountsService.instance;
  }

  static resetInstance(): void {
    RememberedAccountsService.instance = null;
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
    const next: RememberedAccountRecord = {
      identityId: input.identityId,
      identifier: input.identifier.trim(),
      nickname: input.nickname?.trim() || this.buildFallbackNickname(input.identifier),
      avatarUrl: input.avatarUrl ?? null,
      rememberPassword: input.rememberPassword,
      autoLogin: input.autoLogin,
      lastUsedAt: now,
      lastLoginAt: now,
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
    identityId: string,
    profile: { nickname?: string | null; avatarUrl?: string | null },
  ): Promise<void> {
    const data = await this.read();
    const accounts = data.accounts.map((account) =>
      account.identityId === identityId
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

  async remove(identityId: string): Promise<void> {
    const data = await this.read();
    const accounts = data.accounts.filter((account) => account.identityId !== identityId);
    await this.write({ accounts });
  }

  private async read(): Promise<RememberedAccountsFile> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as RememberedAccountsFile;
      this.cache = {
        accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
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
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
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

export function getRememberedAccountsService(logger?: ILogger): RememberedAccountsService {
  return RememberedAccountsService.getInstance(logger);
}

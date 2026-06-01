import type { ILogger } from '@dailyuse/utils/logger';
import { IdentityId } from '@dailyuse/domain-shared';
import type { RememberedDesktopAccountDTO } from '@dailyuse/contracts/authentication';
import { type IpcResult, ok, fail, toIpcResult } from '@dailyuse/contracts/result';
import {
  type RememberedAccountsService,
  type RememberedAccountRecord,
} from '../infrastructure';

/**
 * Manages remembered desktop accounts: listing, removal, lookup, and password decryption.
 */
export class DesktopRememberedAccountService {
  constructor(
    private readonly logger: ILogger,
    private readonly rememberedAccounts: RememberedAccountsService,
  ) {}

  async getRememberedAccounts(): Promise<RememberedDesktopAccountDTO[]> {
    const accounts = await this.rememberedAccounts.list();
    return accounts.map((account) => ({
      identityId: account.identityId,
      identifier: account.identifier,
      nickname: account.nickname,
      avatarUrl: account.avatarUrl,
      rememberPassword: account.rememberPassword,
      autoLogin: account.autoLogin,
      lastUsedAt: account.lastUsedAt,
      lastLoginAt: account.lastLoginAt,
      hasSavedPassword: account.rememberPassword && Boolean(account.encryptedPassword),
    }));
  }

  async removeRememberedAccount(identityId: string): Promise<IpcResult<void>> {
    try {
      await this.rememberedAccounts.remove(IdentityId.of(identityId));
      return toIpcResult(ok(undefined));
    } catch (error) {
      return toIpcResult(
        fail({ code: 'REMEMBERED_ACCOUNT_REMOVE_FAILED', message: String(error) }),
      );
    }
  }

  async findRememberedAccount(identityId: string): Promise<RememberedAccountRecord | null> {
    const accounts = await this.rememberedAccounts.list();
    return accounts.find((account) => String(account.identityId) === identityId) ?? null;
  }

  decryptPassword(account: RememberedAccountRecord): string | null {
    return this.rememberedAccounts.decryptPassword(account);
  }

  async recordLogin(params: {
    identityId: string;
    identifier: string;
    nickname: string | null;
    avatarUrl: string | null;
    rememberPassword: boolean;
    autoLogin: boolean;
    password?: string;
  }): Promise<void> {
    await this.rememberedAccounts.recordLogin({
      ...params,
      identityId: IdentityId.of(params.identityId),
    });
  }

  async getAutoLoginAccount(): Promise<RememberedAccountRecord | null> {
    return this.rememberedAccounts.getAutoLoginAccount();
  }
}

import type { ILogger } from '@dailyuse/utils/logger';
import type { IAccountRepository } from '@dailyuse/account/domain-server';
import { Account } from '@dailyuse/account/domain-server';
import type { IAuthIdentityRepository as IAuthCredentialRepository } from '@dailyuse/authentication/domain-server';
import type {
  AuthIdentityClientDTO,
  TokenStorageData,
} from '@dailyuse/contracts/authentication';
import { TokenManager } from '../infrastructure';

/**
 * Handles account projection bootstrap for guest/offline sessions
 * and provides identity email/nickname extraction helpers.
 */
export class DesktopAuthAccountProjectionService {
  constructor(
    private readonly logger: ILogger,
    private readonly tokenManager: TokenManager,
    private readonly accountRepository: IAccountRepository | null,
  ) {}

  /**
   * Ensure an Account projection exists for guest/local-only sessions.
   * Online sessions skip this because the server provides the account.
   */
  async ensureAccountProjection(identityId: string, email: string | null): Promise<void> {
    if (!this.accountRepository) {
      return;
    }

    const tokenData = this.tokenManager.getCachedTokenData() ?? (await this.tokenManager.loadTokens());
    if (tokenData && !this.isGuestTokenData(tokenData) && !this.isLocalOnlyTokenData(tokenData)) {
      this.logger.info('Skip account projection bootstrap for online session', { identityId });
      return;
    }

    const existing = await this.accountRepository.findById(identityId);
    if (existing) {
      return;
    }

    const normalizedEmail =
      email?.trim().toLowerCase() ?? this.getProjectionFallbackEmail(identityId);
    if (!normalizedEmail) {
      this.logger.warn('Skip account projection bootstrap due to missing email', {
        identityId,
      });
      return;
    }

    const account = Account.create({
      id: identityId as Parameters<typeof Account.create>[0]['id'],
      email: normalizedEmail,
    });
    await this.accountRepository.save(account);
    this.logger.info('Account projection ensured', { identityId });
  }

  /**
   * Check if a given email is already actively logged in the main window.
   * Returns conflict info if found, null otherwise.
   */
  async checkActiveLocalConflict(
    email: string,
    currentIdentityId: string | null,
    credentialRepository: Pick<IAuthCredentialRepository, 'findByEmail'> | null,
  ): Promise<{
    code: string;
    message: string;
    context: Record<string, unknown>;
  } | null> {
    if (!currentIdentityId || !credentialRepository) {
      return null;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return null;
    }

    const existingIdentity = await credentialRepository.findByEmail(normalizedEmail);
    if (!existingIdentity || String(existingIdentity.id) !== currentIdentityId) {
      return null;
    }

    const displayName =
      this.extractNickname(existingIdentity.toClientDTO()) ?? normalizedEmail.split('@')[0];

    return {
      code: 'AUTH_ALREADY_ACTIVE_LOCALLY',
      message: '该账号已在本地主窗口中登录',
      context: {
        identityId: currentIdentityId,
        displayName,
      },
    };
  }

  extractNickname(identity: AuthIdentityClientDTO): string | null {
    const emailIdentifier = identity.identifiers.find(
      (
        identifier,
      ): identifier is Extract<AuthIdentityClientDTO['identifiers'][number], { type: 'Email' }> =>
        identifier.type === 'Email',
    );

    return emailIdentifier?.value?.split('@')[0] || null;
  }

  extractIdentityEmail(identity: AuthIdentityClientDTO): string | null {
    const emailIdentifier = identity.identifiers.find((identifier) => identifier.type === 'Email');
    if (!emailIdentifier) {
      return null;
    }

    const normalized = emailIdentifier.value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  isGuestTokenData(tokenData: TokenStorageData | null): boolean {
    if (!tokenData) {
      return false;
    }
    return (
      tokenData.accessToken === 'guest-local-token' &&
      tokenData.refreshToken === 'guest-local-token'
    );
  }

  isLocalOnlyTokenData(tokenData: TokenStorageData | null): boolean {
    if (!tokenData) {
      return false;
    }

    return tokenData.accessToken === 'local-token' && tokenData.refreshToken === 'local-token';
  }

  private getProjectionFallbackEmail(_identityId: string): string | null {
    return null;
  }
}

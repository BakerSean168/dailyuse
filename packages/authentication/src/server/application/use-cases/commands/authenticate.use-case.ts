/**
 * Authenticate Use Case — 统一认证用例
 *
 * The single application-layer entry point for all pluggable login methods.
 * 所有可插拔登录方式的统一应用层入口。
 *
 * Flow / 流程:
 * 1. Resolve the provider for the requested method (registry dispatch).
 * 2. Delegate credential verification to the provider (pluggable).
 * 3. Issue a Daily Use session (common, shared by every method).
 *
 * This is where the "abstract login interface + pluggable methods" design pays
 * off: adding GitHub / guest / future SSO never re-implements session logic and
 * never edits this use case — only a new provider is registered at composition.
 *
 * 这就是"抽象登录接口 + 可插拔方式"设计的收益点：新增 GitHub / 访客 / 未来 SSO
 * 都不必重复会话逻辑，也不必修改本用例，只需在组合根注册一个新提供者。
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { AuthResponseDTO } from '@dailyuse/contracts/authentication';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import {
  AuthSession,
  type IAuthSessionRepository,
  type ITokenProvider,
} from '../../../domain';
import type { AuthenticationProviderRegistry } from '../../../domain/services/authentication-provider-registry';
import {
  UnsupportedAuthenticationMethodError,
  type AuthenticationMethod,
} from '../../../domain/services/authentication-provider';
import { UserNotFoundError, InvalidPasswordError } from '../../../domain/services/login';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('Authenticate');

/**
 * Unified authentication use case for the pluggable provider architecture.
 */
export class AuthenticateUseCase {
  constructor(
    private readonly registry: AuthenticationProviderRegistry,
    private readonly sessionRepository: IAuthSessionRepository,
    private readonly tokenProvider: ITokenProvider,
  ) {}

  /**
   * Authenticate via the given method, then issue a session.
   *
   * @param method      Pluggable login method id (e.g. 'password', 'github').
   * @param credentials Method-specific credentials (opaque to this use case).
   */
  async execute(
    method: AuthenticationMethod,
    credentials: unknown,
    cx: ExecutionContext,
    deviceId: string,
  ): Promise<Result<AuthResponseDTO>> {
    logger.info('[Authenticate] Starting', { method });

    try {
      // 1. Resolve provider (throws UnsupportedAuthenticationMethodError if missing).
      const provider = this.registry.resolve(method);

      // 2. Provider verifies credentials and resolves a verified identity.
      const { identity, isNewIdentity } = await provider.authenticate(credentials, {
        deviceId,
        cx,
      });

      // 3. Common: issue a Daily Use session (shared by every login method).
      const { AuthSession: session, tokens } = AuthSession.start({
        identityId: identity.id,
        deviceId,
        tokenProvider: this.tokenProvider,
      });
      await this.sessionRepository.save(session);

      logger.info('[Authenticate] Success', {
        method,
        identityId: identity.id,
        sessionId: session.id,
        isNewIdentity,
      });

      return ok({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        identity: identity.toClientDTO(),
        session: session.toClientDTO(true),
      });
    } catch (err) {
      if (err instanceof UnsupportedAuthenticationMethodError) {
        return error(
          'SERVICE_UNAVAILABLE',
          `Authentication method is not enabled: ${err.method}`,
        );
      }

      // Security: never distinguish "user not found" vs "wrong password".
      if (err instanceof UserNotFoundError || err instanceof InvalidPasswordError) {
        return error('UNAUTHORIZED', 'Invalid credentials');
      }

      logger.error('[Authenticate] Failed', {
        method,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}

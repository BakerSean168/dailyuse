import type { ILogger } from '@dailyuse/utils/logger';
import type {
  IAuthSessionRepository,
  IAuthIdentityRepository as IAuthCredentialRepository,
  AuthSession,
} from '@dailyuse/authentication/electron';
import {
  type IpcResult,
  toIpcResult,
  ok,
  fail,
} from '@dailyuse/contracts/result';
import {
  AuthRuntimeState,
  type AuthSessionClientDTO,
  type AuthSessionId,
  type GetCurrentUserRes,
  type ListSessionsRes,
} from '@dailyuse/contracts/authentication';
import { SessionManager, TokenManager } from '../infrastructure';
import type { AuthState } from './desktop-credential-auth-coordinator';
import {
  buildFallbackIdentityClientDTO,
  toIdentityLookupId,
} from './auth-coordinator-helpers';

/**
 * Handles security admin operations: session management.
 */
export class DesktopAuthSecurityAdminService {
  constructor(
    private readonly logger: ILogger,
    private readonly sessionManager: SessionManager | null,
    private readonly tokenManager: TokenManager,
    private readonly credentialRepository: IAuthCredentialRepository | null,
    private readonly sessionRepository: IAuthSessionRepository | null,
    private readonly authState: AuthState,
  ) {}

  // ============================================
  // Sessions Methods
  // ============================================

  async listSessions(): Promise<ListSessionsRes> {
    this.logger.debug('List sessions');

    if (!this.sessionRepository) {
      return { sessions: [] };
    }

    try {
      const currentSession = this.sessionManager?.getCurrentSession();
      if (!currentSession) {
        return { sessions: [] };
      }

      const sessions = await this.sessionRepository.findByIdentityId(currentSession.identityId);
      const sessionInfos: AuthSessionClientDTO[] = sessions.map((s: AuthSession) =>
        s.toClientDTO(s.id === currentSession.id),
      );

      return { sessions: sessionInfos };
    } catch (error) {
      this.logger.error('Failed to list sessions', { error });
      return { sessions: [] };
    }
  }

  async getCurrentUser(): Promise<GetCurrentUserRes> {
    const identityId = this.getCurrentIdentityId();
    const session = this.sessionManager?.getCurrentSession() ?? null;
    const identity = identityId
      ? await this.credentialRepository?.findById(toIdentityLookupId(identityId))
      : null;

    return {
      identity: identity
        ? identity.toClientDTO()
        : buildFallbackIdentityClientDTO(identityId ?? 'unknown'),
      session: session ? session.toClientDTO(true) : null,
    };
  }

  async revokeSession(sessionId?: string): Promise<IpcResult<void>> {
    this.logger.debug('Revoke session', { sessionId });

    if (!sessionId) {
      return toIpcResult(fail({ code: 'VALIDATION_ERROR', message: '缺少 sessionId' }));
    }

    if (!this.sessionRepository) {
      return toIpcResult(fail({ code: 'NOT_INITIALIZED', message: '服务未初始化' }));
    }

    try {
      const session = await this.sessionRepository.findById(sessionId as AuthSessionId);
      if (!session) {
        return toIpcResult(fail({ code: 'NOT_FOUND', message: '会话不存在' }));
      }

      const currentSession = this.sessionManager?.getCurrentSession();
      if (currentSession && session.id === currentSession.id) {
        return toIpcResult(
          fail({ code: 'INVALID_OPERATION', message: '无法撤销当前会话，请使用登出' }),
        );
      }

      session.revoke();
      await this.sessionRepository.save(session);

      this.logger.info('Session revoked', { sessionId });
      return toIpcResult(ok(undefined));
    } catch (error) {
      this.logger.error('Failed to revoke session', { error });
      return toIpcResult(fail({ code: 'REVOKE_ERROR', message: String(error) }));
    }
  }

  // ===== Private Helpers =====

  private getCurrentIdentityId(): string | null {
    if (this.authState.runtimeState === AuthRuntimeState.RESTORING) {
      return null;
    }

    const currentSession = this.sessionManager?.getCurrentSession();
    if (currentSession?.identityId) {
      return currentSession.identityId;
    }

    const tokenData = this.tokenManager.getCachedTokenData();
    return tokenData?.identityId ?? null;
  }
}

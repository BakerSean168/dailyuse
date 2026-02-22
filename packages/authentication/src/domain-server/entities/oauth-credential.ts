/**
 * OAuthCredential 实体实现
 * OAuth 凭证 - Server 端持有 Provider 信息和 Token
 */

import type {
  OAuthCredentialServerDTO,
} from '@dailyuse/contracts/authentication';
import { Entity } from '@dailyuse/utils';

import {
  CredentialStatus,
  OAuthProvider,
  type AuthCredentialId,
} from '../../domain-shared';

/** Domain state for OAuthCredential entity */
export interface OAuthCredentialState {
  id: AuthCredentialId;
  status: typeof CredentialStatus.ACTIVE;
  provider: OAuthProvider;
  providerSubjectId: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}

/**
 * OAuth 凭证实体
 */
export class OAuthCredential extends Entity<AuthCredentialId> {

  // ================= 1. 内部状态 =================
  private _status: typeof CredentialStatus.ACTIVE;
  private _provider: OAuthProvider;
  private _providerSubjectId: string;
  private _accessToken: string | null;
  private _refreshToken: string | null;
  private _expiresAt: Date | null;
  private _createdAt: Date;
  private _lastUsedAt: Date | null;

  // 只读类型标识
   public readonly type = 'OAUTH';

  // ================= 2. 构造函数 =================
  private constructor(state: OAuthCredentialState) {
    super(state.id);

    this._status = state.status;
    if (!state.provider) {
       throw new Error("OAuth Credential must have a provider");
    }
    this._provider = state.provider;
    this._providerSubjectId = state.providerSubjectId;
    this._accessToken = state.accessToken;
    this._refreshToken = state.refreshToken;
    this._expiresAt = state.expiresAt;
    this._createdAt = state.createdAt;
    this._lastUsedAt = state.lastUsedAt;
  }

  // ================= 3. Getters =================
  get status(): typeof CredentialStatus.ACTIVE {
    return this._status;
  }

  get provider(): OAuthProvider {
    return this._provider;
  }

  get providerSubjectId(): string {
    return this._providerSubjectId;
  }

  get accessToken(): string | null {
    return this._accessToken;
  }

  get refreshToken(): string | null {
    return this._refreshToken;
  }

  get expiresAt(): Date | null {
    return this._expiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get lastUsedAt(): Date | null {
    return this._lastUsedAt;
  }

  // ================= 4. 工厂方法 =================

  /**
   * 🏭 业务工厂：创建新的 OAuth 凭证
   */
  public static create(params: {
    id: AuthCredentialId;
    provider: OAuthProvider;
    providerSubjectId: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }): OAuthCredential {
    const now = new Date();
    return new OAuthCredential({
      id: params.id,
      status: CredentialStatus.ACTIVE,
      provider: params.provider,
      providerSubjectId: params.providerSubjectId,
      accessToken: params.accessToken ?? null,
      refreshToken: params.refreshToken ?? null,
      expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
      createdAt: now,
      lastUsedAt: null,
    });
  }

  /**
   * 🏭 恢复工厂：从持久化状态恢复
   */
  public static load(state: OAuthCredentialState): OAuthCredential {
    return new OAuthCredential(state);
  }

  // ================= 5. 业务行为 =================

  /**
   * 更新 Token
   */
  public updateTokens(params: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }): void {
    if (!CredentialStatus.isActive(this._status)) {
      throw new Error('Cannot update tokens on inactive credential');
    }

    this._accessToken = params.accessToken;
    if (params.refreshToken !== undefined) {
      this._refreshToken = params.refreshToken;
    }
    if (params.expiresAt !== undefined) {
      this._expiresAt = new Date(params.expiresAt);
    }
    this._lastUsedAt = new Date();
  }

  /**
   * 记录使用时间
   */
  public recordUsage(): void {
    this._lastUsedAt = new Date();
  }

  /**
   * 检查 Token 是否过期
   */
  public isTokenExpired(): boolean {
    if (!this._expiresAt) {
      return false;
    }
    return this._expiresAt.getTime() < Date.now();
  }

  /**
   * 暂停凭证
   */
  public suspend(): void {
    if (CredentialStatus.isSuspended(this._status)) {
      return;
    }
    this._status = CredentialStatus.SUSPENDED;
  }

  /**
   * 恢复凭证
   */
  public activate(): void {
    if (CredentialStatus.isActive(this._status)) {
      return;
    }
    if (CredentialStatus.isRevoked(this._status)) {
      throw new Error('Cannot activate a revoked credential');
    }
    this._status = CredentialStatus.ACTIVE;
  }

  /**
   * 吊销凭证
   */
  public revoke(): void {
    if (CredentialStatus.isRevoked(this._status)) {
      return;
    }
    this._status = CredentialStatus.REVOKED;
    // 清除敏感 Token
    this._accessToken = null;
    this._refreshToken = null;
  }

  // ================= 6. 序列化 =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): OAuthCredentialServerDTO {
    return {
      id: this.id,
      type: 'OAUTH',
      status: this._status,
      provider: this._provider,
      providerSubjectId: this._providerSubjectId,
      accessToken: this._accessToken,
      refreshToken: this._refreshToken,
      expiresAt: this._expiresAt?.getTime() ?? null,
      createdAt: this._createdAt.getTime(),
      lastUsedAt: this._lastUsedAt?.getTime() ?? null,
    };
  }

}

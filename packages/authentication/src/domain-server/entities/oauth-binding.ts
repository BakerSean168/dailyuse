/**
 * OAuthBinding 实体实现
 * 
 * OAuth 绑定 - Entity 形式的标识符
 * 语义上归入 Identifier 集合（用于"通过第三方查找用户"），而非 Credential
 * 
 * 拥有独立 ID，token 状态可变（Entity 特性）
 * provider + providerSubjectId 构成查找依据
 * accessToken / refreshToken / expiresAt 构成 OAuth Session 数据
 */

import type {
  OAuthBindingServerDTO,
} from '@dailyuse/contracts/authentication';
import { Entity } from '@dailyuse/utils/domain';

import { OAuthProvider } from '../../domain-shared';

/** Domain state for OAuthBinding entity */
export interface OAuthBindingState {
  id: string;
  provider: OAuthProvider;
  providerSubjectId: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}

/**
 * OAuth 绑定实体
 */
export class OAuthBinding extends Entity<string> {

  // ================= 1. 内部状态 =================
  private _provider: OAuthProvider;
  private _providerSubjectId: string;
  private _accessToken: string | null;
  private _refreshToken: string | null;
  private _expiresAt: Date | null;
  private _createdAt: Date;
  private _lastUsedAt: Date | null;

  // ================= 2. 构造函数 =================
  private constructor(state: OAuthBindingState) {
    super(state.id);

    if (!state.provider) {
       throw new Error("OAuthBinding must have a provider");
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
   * 🏭 业务工厂：创建新的 OAuth 绑定
   */
  public static create(params: {
    id: string;
    provider: OAuthProvider;
    providerSubjectId: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }): OAuthBinding {
    return new OAuthBinding({
      id: params.id,
      provider: params.provider,
      providerSubjectId: params.providerSubjectId,
      accessToken: params.accessToken ?? null,
      refreshToken: params.refreshToken ?? null,
      expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
      createdAt: new Date(),
      lastUsedAt: null,
    });
  }

  /**
   * 🏭 恢复工厂：从持久化状态恢复
   */
  public static load(state: OAuthBindingState): OAuthBinding {
    return new OAuthBinding(state);
  }

  // ================= 5. 业务行为 =================

  /**
   * 🔄 刷新 Token（语义更清晰）
   */
  public refreshTokens(params: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }): void {
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
   * 📝 记录使用时间
   */
  public recordUsage(): void {
    this._lastUsedAt = new Date();
  }

  /**
   * ⏰ 检查 Token 是否过期
   */
  public isTokenExpired(): boolean {
    if (!this._expiresAt) {
      return false;
    }
    return this._expiresAt.getTime() < Date.now();
  }

  /**
   * 🗑️ 吊销绑定（清除敏感 Token）
   */
  public revoke(): void {
    this._accessToken = null;
    this._refreshToken = null;
  }

  // ================= 6. 序列化 =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): OAuthBindingServerDTO {
    return {
      id: this.id,
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

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
  OAuthBindingServer,
  OAuthBindingServerDTO,
  OAuthBindingPersistenceDTO,
} from '@dailyuse/contracts/authentication';
import { Entity } from '@dailyuse/utils';

import { OAuthProvider } from '../../domain-shared';


/**
 * OAuth 绑定实体
 */
export class OAuthBinding extends Entity<string> implements OAuthBindingServer {

  // ================= 1. 内部状态 =================
  private _provider: OAuthProvider;
  private _providerSubjectId: string;
  private _accessToken: string | null;
  private _refreshToken: string | null;
  private _expiresAt: Date | null;
  private _createdAt: Date;
  private _lastUsedAt: Date | null;

  // ================= 2. 构造函数 =================
  private constructor(props: OAuthBindingServerDTO) {
    super(props.id);

    if (!props.provider) {
       throw new Error("OAuthBinding must have a provider");
    }
    this._provider = OAuthProvider.of(props.provider);
    this._providerSubjectId = props.providerSubjectId;
    this._accessToken = props.accessToken ?? null;
    this._refreshToken = props.refreshToken ?? null;
    this._expiresAt = props.expiresAt ? new Date(props.expiresAt) : null;
    this._createdAt = new Date(props.createdAt);
    this._lastUsedAt = props.lastUsedAt ? new Date(props.lastUsedAt) : null;
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
    const now = Date.now();
    const dto: OAuthBindingServerDTO = {
      id: params.id,
      provider: params.provider,
      providerSubjectId: params.providerSubjectId,
      accessToken: params.accessToken ?? null,
      refreshToken: params.refreshToken ?? null,
      expiresAt: params.expiresAt ?? null,
      createdAt: now,
      lastUsedAt: null,
    };
    return new OAuthBinding(dto);
  }

  /**
   * 🏭 恢复工厂：从持久化 DTO 恢复
   */
  public static fromPersistenceDTO(dto: OAuthBindingPersistenceDTO): OAuthBinding {
    const serverDTO: OAuthBindingServerDTO = {
      id: dto.id,
      provider: OAuthProvider.of(dto.provider),
      providerSubjectId: dto.providerSubjectId,
      accessToken: dto.accessToken,
      refreshToken: dto.refreshToken,
      expiresAt: dto.expiresAt?.getTime() ?? null,
      createdAt: dto.createdAt.getTime(),
      lastUsedAt: dto.lastUsedAt?.getTime() ?? null,
    };
    return new OAuthBinding(serverDTO);
  }

  /**
   * 🏭 恢复工厂：从 Server DTO 恢复
   */
  public static fromServerDTO(dto: OAuthBindingServerDTO): OAuthBinding {
    return new OAuthBinding(dto);
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

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): OAuthBindingPersistenceDTO {
    return {
      id: this.id,
      provider: this._provider,
      providerSubjectId: this._providerSubjectId,
      accessToken: this._accessToken,
      refreshToken: this._refreshToken,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      lastUsedAt: this._lastUsedAt,
    };
  }
}

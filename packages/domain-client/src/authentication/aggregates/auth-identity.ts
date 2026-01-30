import { AggregateRoot } from '@dailyuse/utils';
import type { 
  AuthIdentityClientDTO, 
  AuthIdentityClient as IAuthIdentityClient,
  AuthCredentialClientDTO 
} from '@dailyuse/contracts/authentication';
import { AuthIdentityStatus, CredentialType, } from '@dailyuse/domain-shared/authentication';
import { AuthCredential } from '../entities/auth-credential';

/**
 * 👤 认证身份聚合根 - 客户端
 * 
 * Client 端看到的身份是脱敏的：
 * - 不包含凭证的敏感信息
 * - 仅显示用户友好的状态信息
 */
export class AuthIdentity extends AggregateRoot<string> implements IAuthIdentityClient {
  // ================= 内部状态 =================
  private _status: AuthIdentityStatus;
  private _failedLoginAttempts: number;
  private _lastFailedAttempt: Date | null;
  private _lockedUntil: Date | null;
  private _credentials: AuthCredential[];
  private _hasPassword: boolean;
  private _hasOAuth: boolean;

  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  // ================= 构造函数 =================
  private constructor(dto: AuthIdentityClientDTO) {
    super(dto.id);
    
    this._status = AuthIdentityStatus.of(dto.status);
    this._failedLoginAttempts = dto.failedLoginAttempts;
    this._lastFailedAttempt = dto.lastFailedAttempt !== null ? new Date(dto.lastFailedAttempt) : null;
    this._lockedUntil = dto.lockedUntil !== null ? new Date(dto.lockedUntil) : null;
    this._credentials = dto.credentials.map(c => AuthCredential.fromClientDTO(c));
    this._hasPassword = dto.hasPassword;
    this._hasOAuth = dto.hasOAuth;
    
    this.createdAt = new Date(dto.createdAt);
    this.updatedAt = new Date(dto.updatedAt);
  }

  // ================= 工厂方法 =================
  
  /**
   * 从 ClientDTO 创建聚合根
   */
  public static fromClientDTO(dto: AuthIdentityClientDTO): AuthIdentity {
    return new AuthIdentity(dto);
  }

  // ================= Getters =================
  
  get status(): AuthIdentityStatus {
    return this._status;
  }

  get failedLoginAttempts(): number {
    return this._failedLoginAttempts;
  }

  get lastFailedAttempt(): Date | null {
    return this._lastFailedAttempt;
  }

  get lockedUntil(): Date | null {
    return this._lockedUntil;
  }

  get credentials(): AuthCredentialClientDTO[] {
    return this._credentials.map(c => c.toClientDTO());
  }

  get hasPassword(): boolean {
    return this._hasPassword;
  }

  get hasOAuth(): boolean {
    return this._hasOAuth;
  }

  // ================= UI 辅助方法 =================

  /**
   * 获取凭证实体列表（非 DTO）
   */
  get credentialList(): AuthCredential[] {
    return this._credentials;
  }

  /**
   * 身份是否处于活跃状态
   */
  get isActive(): boolean {
    return AuthIdentityStatus.isActive(this._status);
  }

  /**
   * 身份是否已被锁定
   */
  get isLocked(): boolean {
    return AuthIdentityStatus.isLocked(this._status);
  }

  /**
   * 身份是否已被禁用
   */
  get isDisabled(): boolean {
    return AuthIdentityStatus.isDisabled(this._status);
  }

  /**
   * 身份是否未验证
   */
  get isUnverified(): boolean {
    return AuthIdentityStatus.isUnverified(this._status);
  }

  /**
   * 是否需要用户干预（如验证邮件）
   */
  get requiresUserAction(): boolean {
    return AuthIdentityStatus.requiresUserAction(this._status);
  }

  /**
   * 是否需要管理员干预
   */
  get requiresAdminAction(): boolean {
    return AuthIdentityStatus.requiresAdminAction(this._status);
  }

  /**
   * 获取状态的 UI 显示名称
   */
  get statusDisplayName(): string {
    return AuthIdentityStatus.getDisplayName(this._status);
  }

  /**
   * 获取状态描述
   */
  get statusDescription(): string {
    return AuthIdentityStatus.getDescription(this._status);
  }

  /**
   * 获取状态样式类
   */
  get statusStyleClass(): string {
    return AuthIdentityStatus.getStyleClass(this._status);
  }

  /**
   * 剩余可尝试登录次数（假设最大5次）
   */
  get remainingAttempts(): number {
    const maxAttempts = 5;
    return Math.max(0, maxAttempts - this._failedLoginAttempts);
  }

  /**
   * 锁定剩余时间描述
   * 例如: "15分钟后解锁", "已解锁"
   */
  get lockRemainingDescription(): string {
    if (!this._lockedUntil) {
      return '未锁定';
    }

    const now = Date.now();
    const lockEnd = this._lockedUntil.getTime();
    
    if (now >= lockEnd) {
      return '已解锁';
    }

    const diffMs = lockEnd - now;
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    
    if (diffMinutes <= 60) {
      return `${diffMinutes}分钟后解锁`;
    }
    
    const diffHours = Math.ceil(diffMinutes / 60);
    return `${diffHours}小时后解锁`;
  }

  /**
   * 是否仍在锁定期内
   */
  get isCurrentlyLocked(): boolean {
    if (!this._lockedUntil) {
      return false;
    }
    return Date.now() < this._lockedUntil.getTime();
  }

  /**
   * 获取主要凭证
   */
  get primaryCredential(): AuthCredential | null {
    return this._credentials.find(c => c.isPrimary) ?? null;
  }

  /**
   * 获取密码凭证
   */
  get passwordCredential(): AuthCredential | null {
    return this._credentials.find(c => c.isPassword) ?? null;
  }

  /**
   * 获取所有 OAuth 凭证
   */
  get oauthCredentials(): AuthCredential[] {
    return this._credentials.filter(c => c.isOAuth);
  }

  /**
   * 凭证数量
   */
  get credentialCount(): number {
    return this._credentials.length;
  }

  /**
   * 是否可以删除凭证（至少保留一个）
   */
  canRemoveCredential(): boolean {
    return this._credentials.length > 1;
  }

  // ================= 不可变更新 =================

  /**
   * 克隆并更新（用于乐观更新）
   */
  public cloneWith(changes: Partial<AuthIdentityClientDTO>): AuthIdentity {
    const currentDTO = this.toClientDTO();
    return new AuthIdentity({
      ...currentDTO,
      ...changes,
    });
  }

  // ================= 序列化 =================

  public toClientDTO(): AuthIdentityClientDTO {
    return {
      id: this.id,
      status: this._status,
      failedLoginAttempts: this._failedLoginAttempts,
      lastFailedAttempt: this._lastFailedAttempt?.getTime() ?? null,
      lockedUntil: this._lockedUntil?.getTime() ?? null,
      credentials: this._credentials.map(c => c.toClientDTO()),
      hasPassword: this._hasPassword,
      hasOAuth: this._hasOAuth,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }
}

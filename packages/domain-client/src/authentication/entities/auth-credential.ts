import { Entity } from '@dailyuse/utils';
import type { AuthCredentialClientDTO, AuthCredentialClient as IAuthCredentialClient } from '@dailyuse/contracts/authentication';
import { AuthCredentialId, CredentialType } from '@dailyuse/domain-shared/authentication';

/**
 * 🔐 认证凭证实体 - 客户端
 * 
 * Client 端看到的凭证是脱敏的：
 * - 不包含哈希密码
 * - 不包含 OAuth AccessToken/RefreshToken
 * - 仅显示用户友好的信息
 */
export class AuthCredential extends Entity<AuthCredentialId> implements IAuthCredentialClient {
  // ================= 内部状态 =================
  private _type: CredentialType;
  private _displayName: string;
  private _lastUsedAt: Date | null;
  private _isPrimary: boolean;

  // ================= 构造函数 =================
  private constructor(dto: AuthCredentialClientDTO) {
    super(AuthCredentialId.of(dto.id));
    
    this._type = CredentialType.of(dto.type);
    this._displayName = dto.displayName;
    this._lastUsedAt = dto.lastUsedAt !== null ? new Date(dto.lastUsedAt) : null;
    this._isPrimary = dto.isPrimary;
  }

  // ================= 工厂方法 =================
  
  /**
   * 从 ClientDTO 创建实体
   */
  public static fromClientDTO(dto: AuthCredentialClientDTO): AuthCredential {
    return new AuthCredential(dto);
  }

  // ================= Getters =================
  
  get type(): CredentialType {
    return this._type;
  }

  get displayName(): string {
    return this._displayName;
  }

  get lastUsedAt(): Date | null {
    return this._lastUsedAt;
  }

  get isPrimary(): boolean {
    return this._isPrimary;
  }

  // ================= UI 辅助方法 =================

  /**
   * 获取凭证类型的 UI 显示名称
   */
  get typeDisplayName(): string {
    return CredentialType.getDisplayName(this._type);
  }

  /**
   * 是否是密码凭证
   */
  get isPassword(): boolean {
    return CredentialType.isPasswordBased(this._type);
  }

  /**
   * 是否是 OAuth 凭证
   */
  get isOAuth(): boolean {
    return CredentialType.isOAuth(this._type);
  }

  /**
   * 是否是手机凭证
   */
  get isPhone(): boolean {
    return CredentialType.isPhoneBased(this._type);
  }

  /**
   * 获取最后使用时间的相对描述
   * 例如: "刚刚使用", "5分钟前", "从未使用"
   */
  get lastUsedDescription(): string {
    if (!this._lastUsedAt) {
      return '从未使用';
    }
    
    const now = Date.now();
    const diffMs = now - this._lastUsedAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '刚刚使用';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 30) return `${diffDays}天前`;
    return '超过30天前';
  }

  // ================= 序列化 =================

  public toClientDTO(): AuthCredentialClientDTO {
    return {
      id: this.id,
      type: this._type,
      displayName: this._displayName,
      lastUsedAt: this._lastUsedAt?.getTime() ?? null,
      isPrimary: this._isPrimary,
    };
  }
}

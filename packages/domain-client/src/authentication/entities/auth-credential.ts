/**
 * AuthCredential Entity - Domain Client
 * 认证凭证实体 - 领域客户端
 *
 * Client 端的凭证是脱敏的：
 * - 不包含哈希密码
 * - 不包含 OAuth AccessToken/RefreshToken
 * - 仅显示用户友好的信息
 */

import type {
  AuthCredentialClient,
  AuthCredentialClientDTO,
} from '@dailyuse/contracts/authentication';
import { Entity } from '@dailyuse/utils';

import {
  AuthCredentialId,
  CredentialType,
} from '@dailyuse/domain-shared/authentication';

export class AuthCredential extends Entity<AuthCredentialId> implements AuthCredentialClient {
  // ================= 内部状态 (Backing Fields) =================
  private _type: CredentialType;
  private _displayName: string;
  private _lastUsedAt: Date | null;
  private _isPrimary: boolean;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 构造函数 (Private) =================
  private constructor(params: {
    id: AuthCredentialId;
    type: CredentialType;
    displayName: string;
    lastUsedAt: Date | null;
    isPrimary: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._type = params.type;
    this._displayName = params.displayName;
    this._lastUsedAt = params.lastUsedAt;
    this._isPrimary = params.isPrimary;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 公共属性 (Getters) =================

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

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // ================= 查询方法 =================

  /**
   * 是否是密码凭证
   */
  public isPassword(): boolean {
    return CredentialType.isPasswordBased(this._type);
  }

  /**
   * 是否是 OAuth 凭证
   */
  public isOAuth(): boolean {
    return CredentialType.isOAuth(this._type);
  }

  /**
   * 是否是手机号凭证
   */
  public isPhone(): boolean {
    return CredentialType.isPhoneBased(this._type);
  }

  // ================= 工厂方法 (Factory Methods) =================

  /**
   * 从 DTO 创建实例
   */
  public static fromDTO(dto: AuthCredentialClientDTO): AuthCredential {
    return new AuthCredential({
      id: AuthCredentialId.of(dto.id),
      type: CredentialType.of(dto.type),
      displayName: dto.displayName,
      lastUsedAt: dto.lastUsedAt ? new Date(dto.lastUsedAt) : null,
      isPrimary: dto.isPrimary,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ================= DTO 转换 =================

  /**
   * 转换为 DTO
   */
  public toDTO(): AuthCredentialClientDTO {
    return {
      id: this.id,
      type: this._type,
      displayName: this._displayName,
      lastUsedAt: this._lastUsedAt?.getTime() ?? null,
      isPrimary: this._isPrimary,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}

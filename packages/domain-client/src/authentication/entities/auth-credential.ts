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
  CredentialType,
} from '@dailyuse/contracts/authentication';
import { Entity } from '@dailyuse/utils';

import {
  AuthCredentialId,
} from '@dailyuse/domain-shared/authentication';

export class AuthCredential extends Entity<AuthCredentialId> implements AuthCredentialClient {
  private readonly _props: AuthCredentialClient;

  // ================= 构造函数 (Private) =================
  private constructor(props: AuthCredentialClient) {
    super(props.id);
    this._props = props;
  }

  // ================= 公共属性 (Getters) =================

  get type(): CredentialType {
    return this._props.type;
  }

  get displayName(): string {
    return this._props.displayName;
  }

  get lastUsedAt(): Date | null {
    return this._props.lastUsedAt;
  }

  get isPrimary(): boolean {
    return this._props.isPrimary;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // ================= 查询方法 =================

  /**
   * 是否是密码凭证
   */
  public isPassword(): boolean {
    return this._props.type === 'PASSWORD';
  }

  /**
   * 是否是 OAuth 凭证
   */
  public isOAuth(): boolean {
    return this._props.type === 'OAUTH';
  }

  /**
   * 是否是手机号凭证
   */
  public isPhone(): boolean {
    return this._props.type === 'PHONE';
  }

  // ================= 工厂方法 (Factory Methods) =================

  /**
   * 从 DTO 创建实例
   */
  public static fromDTO(dto: AuthCredentialClientDTO): AuthCredential {
    return new AuthCredential({
      id: AuthCredentialId.of(dto.id),
      type: dto.type,
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
      id: String(this._props.id) as AuthCredentialClientDTO['id'],
      type: this._props.type,
      displayName: this._props.displayName,
      lastUsedAt: this._props.lastUsedAt?.getTime() ?? null,
      isPrimary: this._props.isPrimary,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}

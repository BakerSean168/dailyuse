/**
 * AuthIdentity Aggregate Root - Domain Client
 * 认证身份聚合根 - 领域客户端
 *
 * Client 端的身份是脱敏的：
 * - 不包含凭证的敏感信息
 * - 仅显示用户友好的状态信息
 */

import type {
  AuthIdentityClient,
  AuthIdentityClientDTO,
  AuthCredentialClient,
  AuthIdentityStatus,
} from '@dailyuse/contracts/authentication';
import { AggregateRoot } from '@dailyuse/utils';

import {
  AuthIdentityStatus as AuthIdentityStatusVO,
} from '@dailyuse/domain-shared/authentication';
import { IdentityId } from '@dailyuse/domain-shared/shared';

import { AuthCredential } from '../entities';

// 内部状态接口
interface AuthIdentityState {
  id: IdentityId;
  status: AuthIdentityStatus;
  failedLoginAttempts: number;
  lastFailedAttempt: Date | null;
  lockedUntil: Date | null;
  credentials: AuthCredential[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class AuthIdentity extends AggregateRoot<IdentityId> implements AuthIdentityClient {
  private readonly _props: AuthIdentityState;

  // ================= 构造函数 (Private) =================
  private constructor(props: AuthIdentityState) {
    // Cast is safe: fromDTO always provides IdentityId value object
    super(IdentityId.of(props.id));
    this._props = props;
  }

  // ================= 公共属性 (Getters) =================

  get status(): AuthIdentityStatus {
    return this._props.status;
  }

  get failedLoginAttempts(): number {
    return this._props.failedLoginAttempts;
  }

  get lastFailedAttempt(): Date | null {
    return this._props.lastFailedAttempt;
  }

  get lockedUntil(): Date | null {
    return this._props.lockedUntil;
  }

  get credentials(): AuthCredentialClient[] {
    return this._props.credentials;
  }

  get hasPassword(): boolean {
    return this._props.credentials.some(
      (cred) => cred.type === 'PASSWORD'
    );
  }

  get hasOAuth(): boolean {
    return this._props.credentials.some(
      (cred) => cred.type === 'OAUTH'
    );
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

  // ================= 工厂方法 (Factory Methods) =================

  /**
   * 从 DTO 创建实例
   */
  public static fromDTO(dto: AuthIdentityClientDTO): AuthIdentity {
    return new AuthIdentity({
      id: IdentityId.of(dto.id),
      status: AuthIdentityStatusVO.of(dto.status),
      failedLoginAttempts: dto.failedLoginAttempts,
      lastFailedAttempt: dto.lastFailedAttempt
        ? new Date(dto.lastFailedAttempt)
        : null,
      lockedUntil: dto.lockedUntil ? new Date(dto.lockedUntil) : null,
      credentials: dto.credentials.map((cred) => AuthCredential.fromDTO(cred)),
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
  public toDTO(): AuthIdentityClientDTO {
    return {
      id: String(this._props.id),
      status: this._props.status,
      failedLoginAttempts: this._props.failedLoginAttempts,
      lastFailedAttempt: this._props.lastFailedAttempt?.getTime() ?? null,
      lockedUntil: this._props.lockedUntil?.getTime() ?? null,
      credentials: this._props.credentials.map((cred) => (cred as AuthCredential).toDTO()),
      hasPassword: this.hasPassword,
      hasOAuth: this.hasOAuth,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}

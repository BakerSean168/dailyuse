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
  AuthCredentialClientDTO,
} from '@dailyuse/contracts/authentication';
import { AggregateRoot } from '@dailyuse/utils';

import {
  AuthIdentityStatus,
  CredentialType,
} from '@dailyuse/domain-shared/authentication';
import { IdentityId } from '@dailyuse/domain-shared/shared';

import { AuthCredential } from '../entities';

export class AuthIdentity extends AggregateRoot<IdentityId> implements AuthIdentityClient {
  // ================= 内部状态 (Backing Fields) =================
  private _status: typeof AuthIdentityStatus.ACTIVE;
  private _failedLoginAttempts: number;
  private _lastFailedAttempt: Date | null;
  private _lockedUntil: Date | null;
  private _credentials: AuthCredential[];
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 构造函数 (Private) =================
  private constructor(params: {
    id: string;
    status: typeof AuthIdentityStatus.ACTIVE;
    failedLoginAttempts: number;
    lastFailedAttempt: Date | null;
    lockedUntil: Date | null;
    credentials: AuthCredential[];
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(IdentityId.of(params.id));
    this._status = params.status;
    this._failedLoginAttempts = params.failedLoginAttempts;
    this._lastFailedAttempt = params.lastFailedAttempt;
    this._lockedUntil = params.lockedUntil;
    this._credentials = params.credentials;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 公共属性 (Getters) =================

  get status(): typeof AuthIdentityStatus.ACTIVE {
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
    return this._credentials.map((cred) => cred.toDTO());
  }

  get hasPassword(): boolean {
    return this._credentials.some(
      (cred) => cred.type === CredentialType.PASSWORD
    );
  }

  get hasOAuth(): boolean {
    return this._credentials.some(
      (cred) => cred.type === CredentialType.OAUTH
    );
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

  // ================= 工厂方法 (Factory Methods) =================

  /**
   * 从 DTO 创建实例
   */
  public static fromDTO(dto: AuthIdentityClientDTO): AuthIdentity {
    return new AuthIdentity({
      id: dto.id,
      status: AuthIdentityStatus.of(dto.status),
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
      id: String(this.id),
      status: this._status,
      failedLoginAttempts: this._failedLoginAttempts,
      lastFailedAttempt: this._lastFailedAttempt?.getTime() ?? null,
      lockedUntil: this._lockedUntil?.getTime() ?? null,
      credentials: this._credentials.map((cred) => cred.toDTO()),
      hasPassword: this.hasPassword,
      hasOAuth: this.hasOAuth,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}

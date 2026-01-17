/**
 * JWT Payload Value Object
 * JWT 载荷值对象 - 表示解析后的 JWT 载荷中的数据
 */

import type { JwtPayloadServer } from '@dailyuse/contracts/authentication';

/**
 * JWT Payload 值对象
 * 封装 JWT 令牌中的载荷数据，提供验证和转换能力
 */
export class JwtPayload {
  public readonly accountUuid: string;
  public readonly type: 'access' | 'refresh';
  public readonly iat: number; // issued at
  public readonly exp: number; // expiration time
  public readonly jti?: string; // JWT ID
  public readonly iss?: string; // issuer
  public readonly aud?: string; // audience

  constructor(params: {
    accountUuid: string;
    type: 'access' | 'refresh';
    iat: number;
    exp: number;
    jti?: string;
    iss?: string;
    aud?: string;
  }) {
    // 验证必需字段
    if (!params.accountUuid) {
      throw new Error('accountUuid is required');
    }
    if (!params.type) {
      throw new Error('type is required');
    }
    if (params.type !== 'access' && params.type !== 'refresh') {
      throw new Error('type must be either "access" or "refresh"');
    }
    if (params.iat == null || typeof params.iat !== 'number') {
      throw new Error('iat (issued at) is required and must be a number');
    }
    if (params.exp == null || typeof params.exp !== 'number') {
      throw new Error('exp (expiration time) is required and must be a number');
    }

    // 验证过期时间
    if (params.exp <= params.iat) {
      throw new Error('exp must be greater than iat');
    }

    this.accountUuid = params.accountUuid;
    this.type = params.type;
    this.iat = params.iat;
    this.exp = params.exp;
    this.jti = params.jti;
    this.iss = params.iss;
    this.aud = params.aud;
  }

  /**
   * 检查令牌是否已过期
   */
  public isExpired(nowSeconds?: number): boolean {
    const now = (nowSeconds ?? Math.floor(Date.now() / 1000));
    return this.exp < now;
  }

  /**
   * 检查令牌是否仍然有效
   */
  public isValid(nowSeconds?: number): boolean {
    return !this.isExpired(nowSeconds);
  }

  /**
   * 获取令牌距离过期的剩余秒数
   */
  public getTimeToExpiry(nowSeconds?: number): number {
    const now = (nowSeconds ?? Math.floor(Date.now() / 1000));
    return Math.max(0, this.exp - now);
  }

  /**
   * 转换为 DTO
   */
  public toDTO(): JwtPayloadServer {
    return {
      accountUuid: this.accountUuid,
      type: this.type,
      iat: this.iat,
      exp: this.exp,
      jti: this.jti,
      iss: this.iss,
      aud: this.aud,
    };
  }

  /**
   * 转换为字典（用于 JWT 签名）
   */
  public toDictionary(): Record<string, any> {
    const payload: Record<string, any> = {
      accountUuid: this.accountUuid,
      type: this.type,
      iat: this.iat,
      exp: this.exp,
    };

    if (this.jti) payload.jti = this.jti;
    if (this.iss) payload.iss = this.iss;
    if (this.aud) payload.aud = this.aud;

    return payload;
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromDTO(dto: JwtPayloadServer): JwtPayload {
    return new JwtPayload({
      accountUuid: dto.accountUuid,
      type: dto.type,
      iat: dto.iat,
      exp: dto.exp,
      jti: dto.jti,
      iss: dto.iss,
      aud: dto.aud,
    });
  }

  /**
   * 从字典创建值对象
   */
  public static fromDictionary(payload: Record<string, any>): JwtPayload {
    return new JwtPayload({
      accountUuid: payload.accountUuid,
      type: payload.type,
      iat: payload.iat,
      exp: payload.exp,
      jti: payload.jti,
      iss: payload.iss,
      aud: payload.aud,
    });
  }
}

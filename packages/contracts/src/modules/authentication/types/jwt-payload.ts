/**
 * JWT Payload Types
 * JWT 载荷相关类型定义
 */

/**
 * JWT 载荷接口
 * 表示 JWT 令牌中的标准载荷数据
 */
export interface JwtPayloadDTO {
  /** 账户唯一标识符 */
  accountUuid: string;
  /** 令牌类型 */
  type: 'access' | 'refresh';
  /** 签发时间 (Unix 时间戳) */
  iat: number;
  /** 过期时间 (Unix 时间戳) */
  exp: number;
  /** JWT ID - 可选的令牌唯一标识符 */
  jti?: string;
  /** 签发者 - 可选的令牌签发者标识 */
  iss?: string;
  /** 受众 - 可选的令牌目标受众 */
  aud?: string;
}

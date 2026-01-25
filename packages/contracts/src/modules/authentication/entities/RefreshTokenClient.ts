/**
 * RefreshToken Entity - Client Interface
 * 刷新令牌实体 - 客户端接口
 */

// ============ DTO 定义 ============

/**
 * RefreshToken Client DTO
 */
export interface RefreshTokenClientDTO {
  uuid: string;
  sessionUuid: string;
  token: string;
  expiresAt: number;
  createdAt: number;
  usedAt?: number | null;
}

// ============ 实体接口 ============

export interface RefreshTokenClient {
  uuid: string;
  sessionUuid: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: number | null;

  toClientDTO(): RefreshTokenClientDTO;
}

export interface RefreshTokenClientStatic {
  fromClientDTO(dto: RefreshTokenClientDTO): RefreshTokenClient;
}

import type { AuthIdentityClientDTO, AuthSessionClientDTO } from '../aggregates';

// 登录成功后的回包 (Token + User Info)
export interface AuthResponseDTO {
  accessToken: string;
  refreshToken?: string;
  identity: AuthIdentityClientDTO;
  session: AuthSessionClientDTO;
}

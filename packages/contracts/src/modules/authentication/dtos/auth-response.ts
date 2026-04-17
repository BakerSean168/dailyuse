import type { AuthIdentityClientDTO } from '../aggregates/auth-identity-client';
import type { AuthSessionClientDTO } from '../aggregates/auth-session-client';

// 登录成功后的回包 (Token + User Info)
export interface AuthResponseDTO {
  accessToken: string;
  refreshToken?: string;
  identity: AuthIdentityClientDTO;
  session: AuthSessionClientDTO;
}

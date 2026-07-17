/**
 * Password Authentication Provider — 账密认证提供者
 *
 * The first pluggable login method. Wraps the existing email/password
 * verification (LoginService) behind the AuthenticationProvider contract,
 * with zero change to the underlying verification behavior.
 *
 * 第一个可插拔登录方式。将既有的邮箱/密码校验（LoginService）包装到
 * AuthenticationProvider 契约之下，底层校验行为完全不变。
 */

import type { LoginByEmailReq } from '@dailyuse/contracts/authentication';
import type {
  AuthenticationContext,
  AuthenticationProvider,
  AuthenticationResult,
} from '../authentication-provider';
import { AuthenticationMethod } from '../authentication-provider';
import { LoginService } from '../login';
import type { IAuthIdentityRepository } from '../../repositories/i-auth-identity.repository';
import type { IPasswordHasher } from '../i-password-hasher.service';

/** Credentials accepted by the password provider. */
export type PasswordCredentials = Pick<LoginByEmailReq, 'email' | 'password'>;

export class PasswordAuthenticationProvider
  implements AuthenticationProvider<PasswordCredentials>
{
  readonly method = AuthenticationMethod.Password;

  private readonly loginService: LoginService;

  constructor(
    identityRepository: IAuthIdentityRepository,
    passwordHasher: IPasswordHasher,
  ) {
    this.loginService = new LoginService(identityRepository, passwordHasher);
  }

  async authenticate(
    credentials: PasswordCredentials,
    _context: AuthenticationContext,
  ): Promise<AuthenticationResult> {
    const identity = await this.loginService.loginByEmail({
      email: credentials.email,
      password: credentials.password,
    });

    // Password login never provisions a new identity; registration is separate.
    // 账密登录不会新建身份；注册是独立流程。
    return { identity, isNewIdentity: false };
  }
}

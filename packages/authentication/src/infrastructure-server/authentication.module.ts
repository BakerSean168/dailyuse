import type {
  IAuthIdentityRepository,
  IAuthSessionRepository,
} from '../domain-server';
import type { ITokenProvider } from '../domain-server/services/token-provider.interface';
import type { IPasswordHasher } from '../domain-shared';
import {
  Login,
  Logout,
  Register,
  RefreshToken,
} from '../application-server';

export interface AuthenticationModuleDependencies {
  readonly identityRepository: IAuthIdentityRepository;
  readonly sessionRepository: IAuthSessionRepository;
  readonly passwordHasher: IPasswordHasher;
  readonly tokenProvider: ITokenProvider;
}

export class AuthenticationModule {
  public readonly identityRepository: IAuthIdentityRepository;
  public readonly sessionRepository: IAuthSessionRepository;
  public readonly passwordHasher: IPasswordHasher;
  public readonly tokenProvider: ITokenProvider;

  public readonly login: Login;
  public readonly logout: Logout;
  public readonly register: Register;
  public readonly refreshToken: RefreshToken;

  constructor(dependencies: AuthenticationModuleDependencies) {
    this.identityRepository = dependencies.identityRepository;
    this.sessionRepository = dependencies.sessionRepository;
    this.passwordHasher = dependencies.passwordHasher;
    this.tokenProvider = dependencies.tokenProvider;

    this.login = new Login(
      this.identityRepository,
      this.sessionRepository,
      this.passwordHasher,
      this.tokenProvider,
    );
    this.logout = new Logout(this.sessionRepository);
    this.register = new Register(
      this.identityRepository,
      this.sessionRepository,
      this.passwordHasher,
      this.tokenProvider,
    );
    this.refreshToken = new RefreshToken(
      this.sessionRepository,
      this.identityRepository,
      this.tokenProvider,
    );
  }
}

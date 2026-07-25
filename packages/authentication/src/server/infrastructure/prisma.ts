import type { PrismaClient } from '@dailyuse/database';
import { createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils/domain';
import type { IPasswordHasher, ITokenProvider } from '../domain';
import {
  createAuthenticationModule,
  type AuthenticationModuleInstance,
  type AuthenticationModuleRuntimeContribution,
} from './authentication.module';
import { PrismaAuthIdentityRepository, PrismaAuthSessionRepository } from './adapters/prisma';
import { Argon2Hasher } from './encryptors/argon2-hasher';
import { GithubOAuthClient } from './services/github-oauth-client';
import {
  MockGithubOAuthClient,
  isMockGithubOAuthClientId,
} from './services/mock-github-oauth-client';
import { GithubAuthenticationProvider, type AuthenticationProvider } from '../domain';
import { createAuthenticationRuntimeContribution } from './runtime';

/**
 * Optional GitHub login configuration (ADR-034: identity-only).
 * 可选 GitHub 登录配置（ADR-034：仅身份认证）。
 *
 * When present, the GitHub authentication provider is registered so the
 * `/auth/oauth/callback` route can resolve GitHub logins. When absent, GitHub
 * login simply surfaces as SERVICE_UNAVAILABLE — no code path is broken.
 * 提供时注册 GitHub 认证提供者，使 `/auth/oauth/callback` 路由可解析 GitHub 登录；
 * 未提供时 GitHub 登录表现为 SERVICE_UNAVAILABLE，不破坏任何路径。
 */
export interface GithubLoginConfig {
  readonly clientId: string;
  readonly clientSecret: string;
}

export interface CreateAuthenticationPrismaModuleOptions {
  readonly tokenProvider: ITokenProvider;
  readonly passwordHasher?: IPasswordHasher;
  /**
   * Enable GitHub login by supplying GitHub App / OAuth credentials.
   * 提供 GitHub App / OAuth 凭据以启用 GitHub 登录。
   */
  readonly github?: GithubLoginConfig;
  readonly runtimeContributions?:
    | AuthenticationModuleRuntimeContribution
    | readonly AuthenticationModuleRuntimeContribution[];
}

export function createAuthenticationPrismaModule(
  db: PrismaClient,
  options: CreateAuthenticationPrismaModuleOptions,
): AuthenticationModuleInstance {
  const eventBusAdapter = createEventBusAdapter(eventBus);
  const identityRepository = new PrismaAuthIdentityRepository(db, eventBusAdapter);

  // Assemble optional pluggable providers. The password provider is always
  // registered by the module itself; here we only add opt-in methods.
  // 组装可选可插拔提供者：账密提供者由模块本身默认注册，此处仅叠加按需启用的方式。
  const authenticationProviders: AuthenticationProvider[] = [];
  let githubOAuthClient: GithubOAuthClient | MockGithubOAuthClient | undefined;
  if (options.github) {
    githubOAuthClient = isMockGithubOAuthClientId(options.github.clientId)
      ? new MockGithubOAuthClient()
      : new GithubOAuthClient({
          clientId: options.github.clientId,
          clientSecret: options.github.clientSecret,
        });
    authenticationProviders.push(
      new GithubAuthenticationProvider(githubOAuthClient, identityRepository),
    );
  }

  const sessionRepository = new PrismaAuthSessionRepository(db, eventBusAdapter);
  const cascadeRuntime = createAuthenticationRuntimeContribution({
    identityRepository,
    sessionRepository,
  });
  const extraRuntime = options.runtimeContributions
    ? Array.isArray(options.runtimeContributions)
      ? Array.from(options.runtimeContributions)
      : [options.runtimeContributions]
    : [];

  return createAuthenticationModule({
    identityRepository,
    sessionRepository,
    passwordHasher: options.passwordHasher ?? new Argon2Hasher(),
    tokenProvider: options.tokenProvider,
    authenticationProviders,
    githubOAuth: options.github
      ? {
          clientId: options.github.clientId,
        }
      : undefined,
    githubOAuthClient,
    runtimeContributions: [cascadeRuntime, ...extraRuntime],
  });
}

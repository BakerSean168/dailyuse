/**
 * Authentication API Module Definition
 *
 * Implements IApiModule standard interface:
 * 1. Composition Root (AuthenticationContainer -> UseCases -> Handlers)
 * 2. Route definition and mounting
 * 3. Initialization task registration
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import { ok, fail } from '@dailyuse/contracts/result';
import { eventBus } from '@dailyuse/utils';
import { createEventBusAdapter } from '@dailyuse/patterns';
import {
  AuthenticationContainer,
  AuthenticationRepositoryFactory,
  AuthenticationModule,
} from '../infrastructure-server';
import { UserAlreadyExistsError } from '../domain-server/services/registration';
import { UserNotFoundError, InvalidPasswordError } from '../domain-server/services/login';
// Commented out temporarily:
// import {
//   ChangePassword,
//   ForgotPassword,
//   ResetPassword,
//   Enable2FA,
//   Verify2FA,
//   Disable2FA,
//   GetActiveSessions,
//   RevokeSession,
//   RevokeAllSessions,
//   CreateApiKey,
//   ListApiKeys,
//   RevokeApiKey,
// } from '../application-server';
import { registerAuthenticationRoutes } from './routes';
import type { AuthenticationUseCases } from '../controllers/auth.controller';
import { registerAuthenticationInitializationTasks } from './initialization';
import { JwtTokenProvider } from '@/infrastructure-server/services/jwt-token-provider';

/**
 * Module context (structurally compatible with IApiModuleContext from apps/api).
 * Locally defined to avoid circular dependency on apps/api.
 */
export interface AuthenticationApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
}

export interface AuthenticationApiModuleDef {
  readonly name: string;
  register(context: AuthenticationApiModuleContext): void;
  destroy?(): void;
}

export const AuthenticationApiModule: AuthenticationApiModuleDef = {
  name: 'Authentication',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root - create container with shared database client
    const container = AuthenticationContainer.getInstance();
    const eventBusAdapter = createEventBusAdapter(eventBus);
    const { identityRepository, sessionRepository } =
      AuthenticationRepositoryFactory.createAllRepositories(
        'prisma',
        db as PrismaClient,
        eventBusAdapter,
      );
    container.setIdentityRepository(identityRepository);
    container.setSessionRepository(sessionRepository);
    const identityRepo = container.getIdentityRepository();
    const sessionRepo = container.getSessionRepository();
    const passwordHasher = container.getPasswordHasher();

    // Initialize token provider with configuration
    // Uses JWT_SECRET (shared with authMiddleware) for access tokens,
    // and REFRESH_TOKEN_SECRET (falling back to JWT_SECRET) for refresh tokens.
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || jwtSecret;
    const tokenProvider = new JwtTokenProvider(
      jwtSecret,
      refreshSecret,
      15 * 60 * 1000, // 15 minutes for access token
      7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
    );

    // 2. Create use-case service instances via composition root
    const authenticationModule = new AuthenticationModule({
      identityRepository: identityRepo,
      sessionRepository: sessionRepo,
      passwordHasher,
      tokenProvider,
    });

    // Commented out temporarily:
    // const changePasswordService = new ChangePassword(identityRepo, passwordHasher);
    // const forgotPasswordService = new ForgotPassword(identityRepo);
    // const resetPasswordService = new ResetPassword(identityRepo, passwordHasher);
    // const enable2faService = new Enable2FA(identityRepo);
    // const verify2faService = new Verify2FA(identityRepo);
    // const disable2faService = new Disable2FA(identityRepo);
    // const getActiveSessionsService = new GetActiveSessions(sessionRepo);
    // const revokeSessionService = new RevokeSession(sessionRepo);
    // const revokeAllSessionsService = new RevokeAllSessions(sessionRepo);
    // const createApiKeyService = new CreateApiKey(identityRepo);
    // const listApiKeysService = new ListApiKeys(identityRepo);
    // const revokeApiKeyService = new RevokeApiKey(identityRepo);

    // 3. Build handler map
    const handlers: AuthenticationUseCases = {
      register: async (data, cx) => {
        try {
          return ok(await authenticationModule.register.execute(data, cx));
        } catch (err) {
          if (err instanceof UserAlreadyExistsError) {
            return fail({ code: 'CONFLICT', message: err.message });
          }
          throw err;
        }
      },
      registerByPhone: async (_data, _cx) =>
        fail({
          code: 'SERVICE_UNAVAILABLE',
          message: 'Phone registration is not implemented on the server yet',
        }),
      login: async (data, cx) => {
        try {
          return ok(await authenticationModule.login.execute(data, cx));
        } catch (err) {
          // Security: don't distinguish "user not found" vs "wrong password"
          if (err instanceof UserNotFoundError || err instanceof InvalidPasswordError) {
            return fail({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
          }
          throw err;
        }
      },
      loginByPhone: async (_data, _cx) =>
        fail({
          code: 'SERVICE_UNAVAILABLE',
          message: 'Phone login is not implemented on the server yet',
        }),
      sendSmsCode: async (_data) =>
        fail({
          code: 'SERVICE_UNAVAILABLE',
          message: 'SMS verification is not implemented on the server yet',
        }),
      logout: async (cx) => {
        await authenticationModule.logout.execute(undefined as void, cx);
        return ok(undefined as void);
      },
      refreshToken: async (data, cx) =>
        ok(await authenticationModule.refreshToken.execute(data, cx)),
      getCurrentUser: async (cx, sessionId) =>
        ok(await authenticationModule.getCurrentUser.execute(cx.identityId, sessionId)),
      listSessions: async (cx, sessionId) =>
        ok(await authenticationModule.listSessions.execute(cx.identityId, sessionId)),
      revokeSession: async (data, cx) => {
        await authenticationModule.revokeSession.execute(data, cx);
        return ok(undefined as void);
      },
      changePassword: async (data, cx) => {
        await authenticationModule.changePassword.execute(data, cx);
        return ok(undefined as void);
      },
      forgotPassword: async (_data) =>
        fail({
          code: 'SERVICE_UNAVAILABLE',
          message: 'Forgot password is not implemented on the server yet',
        }),
      resetPassword: async (_data) =>
        fail({
          code: 'SERVICE_UNAVAILABLE',
          message: 'Password reset is not implemented on the server yet',
        }),
    };

    // 4. Register routes
    const authRoutes = registerAuthenticationRoutes(handlers, middleware, context.openApiRegistry);

    // 5. Mount onto API router
    router.use('/auth', authRoutes);

    // 6. Register initialization tasks (event handlers)
    registerAuthenticationInitializationTasks();
  },
};

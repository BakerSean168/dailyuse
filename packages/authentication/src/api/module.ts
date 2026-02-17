/**
 * Authentication API Module Definition
 *
 * Implements IApiModule standard interface:
 * 1. Composition Root (AuthenticationContainer �?UseCases �?Handlers)
 * 2. Route definition and mounting
 * 3. Initialization task registration
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 */

import { Router } from 'express';
import { prisma } from '@dailyuse/database';
import { AuthenticationContainer, AuthenticationModule } from '../infrastructure-server';
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
import type { AuthenticationRouteHandlers } from './routes';
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
}

export interface AuthenticationApiModuleDef {
  readonly name: string;
  register(context: AuthenticationApiModuleContext): void;
  destroy?(): void;
}

export const AuthenticationApiModule: AuthenticationApiModuleDef = {
  name: 'Authentication',

  register(context) {
    const { router, middleware } = context;

    // 1. Composition Root �?create container with shared database client
    const container = new AuthenticationContainer(prisma);
    const identityRepo = container.getIdentityRepository();
    const sessionRepo = container.getSessionRepository();
    const passwordHasher = container.getPasswordHasher();
    
    // Initialize token provider with configuration
    // TODO: Move these to environment variables or ConfigService
    const tokenProvider = new JwtTokenProvider(
      process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      15 * 60 * 1000, // 15 minutes for access token
      7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
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
    const handlers: AuthenticationRouteHandlers = {
      register: (data, cx) => authenticationModule.register.execute(data, cx),
      login: (data, cx) => authenticationModule.login.execute(data, cx),
      logout: (data, cx) => authenticationModule.logout.execute(data, cx),
      refreshToken: (data, cx) => authenticationModule.refreshToken.execute(data, cx),
      // getActiveSessions: (identityId) => getActiveSessionsService.execute(identityId),
      // revokeSession: (sessionId, identityId) => revokeSessionService.execute(sessionId, identityId),
      // revokeAllSessions: (identityId) => revokeAllSessionsService.executeForWeb(identityId),
      // enable2fa: (identityId, method) => enable2faService.execute(identityId, method),
      // disable2fa: (identityId) => disable2faService.execute(identityId),
      // verify2fa: (sessionId, code) => verify2faService.execute(sessionId, code),
      // createApiKey: (identityId, name, expiresInDays) => createApiKeyService.execute(identityId, name, expiresInDays),
      // listApiKeys: (identityId) => listApiKeysService.execute(identityId),
      // revokeApiKey: (keyId, identityId) => revokeApiKeyService.execute(keyId, identityId),
      // changePassword: (identityId, currentPassword, newPassword) => changePasswordService.execute(identityId, currentPassword, newPassword),
      // forgotPassword: (email) => forgotPasswordService.execute(email),
      // resetPassword: (token, newPassword) => resetPasswordService.execute(token, newPassword),
    };

    // 4. Register routes
    const authRoutes = registerAuthenticationRoutes(handlers, middleware);

    // 5. Mount onto API router
    router.use('/auth', authRoutes);

    // 6. Register initialization tasks (event handlers)
    registerAuthenticationInitializationTasks();
  },
};

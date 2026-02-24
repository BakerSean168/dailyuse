/**
 * Authentication Module — Electron Entry Point
 *
 * Self-contained Composition Root for the Authentication module in Electron main process.
 * Creates SQLite repositories, Argon2 password hasher, JWT token provider,
 * and registers IPC handlers via the AuthenticationModule facade.
 *
 * @module authentication/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import {
  SqliteAuthIdentityRepository,
  SqliteAuthSessionRepository,
  Argon2Hasher,
  AuthenticationModule,
  AuthenticationContainer,
} from '../infrastructure-server';
import { JwtTokenProvider } from '../infrastructure-server/services/jwt-token-provider';
import { AuthenticationController } from '../controllers/auth.controller';
import type { AuthenticationUseCases } from '../controllers/auth.controller';
import { UserAlreadyExistsError } from '../domain-server/services/registration';
import { ok, fail } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils';
import type { Context } from '@dailyuse/contracts/shared';

const logger = createLogger('AuthenticationElectron');

const Ch = {
  LOGIN: 'auth:login',
  REGISTER: 'auth:register',
  LOGOUT: 'auth:logout',
  GET_CURRENT_USER: 'auth:current-user',
  CHECK_AUTH: 'auth:check',
  REFRESH_TOKEN: 'auth:refresh-token',
} as const;

const channels = Object.values(Ch);

export const AuthenticationElectronModule: IElectronModule = {
  name: 'Authentication',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // 1. Repositories
    const identityRepository = new SqliteAuthIdentityRepository(db);
    const sessionRepository = new SqliteAuthSessionRepository(db);
    const passwordHasher = new Argon2Hasher();
    const tokenProvider = new JwtTokenProvider(
      process.env.JWT_ACCESS_SECRET || 'desktop-access-secret-key',
      process.env.JWT_REFRESH_SECRET || 'desktop-refresh-secret-key',
      15 * 60 * 1000,        // 15 minutes access token
      7 * 24 * 60 * 60 * 1000, // 7 days refresh token
    );

    // 2. Composition Root
    const authModule = new AuthenticationModule({
      identityRepository,
      sessionRepository,
      passwordHasher,
      tokenProvider,
    });

    // 3. Controller (Zod validation + use case orchestration)
    const useCases: AuthenticationUseCases = {
      register: async (data, cx) => {
        try {
          return ok(await authModule.register.execute(data, cx));
        } catch (err) {
          if (err instanceof UserAlreadyExistsError) {
            return fail({ code: 'CONFLICT', message: err.message });
          }
          throw err;
        }
      },
      login: async (data, cx) => ok(await authModule.login.execute(data, cx)),
      logout: async (cx) => {
        await authModule.logout.execute(undefined as void, cx);
        return ok(undefined as void);
      },
      refreshToken: async (data, cx) => ok(await authModule.refreshToken.execute(data, cx)),
    };

    const controller = new AuthenticationController(useCases);

    // 4. IPC Handlers
    const electronContext: Context = { identityId: '', deviceId: 'electron-app' };

    ipcMain.handle(Ch.LOGIN, (_event, data) =>
      controller.login(data, { ...electronContext, deviceId: 'electron-app' }),
    );

    ipcMain.handle(Ch.REGISTER, (_event, data) =>
      controller.register(data, electronContext),
    );

    ipcMain.handle(Ch.LOGOUT, (_event, cx?: Partial<Context>) =>
      controller.logout({ ...electronContext, ...cx }),
    );

    ipcMain.handle(Ch.REFRESH_TOKEN, (_event, data) =>
      controller.refreshToken(data, electronContext),
    );

    ipcMain.handle(Ch.GET_CURRENT_USER, async (_event, identityId: string) => {
      if (!identityId) return null;
      const identity = await identityRepository.findById(identityId);
      return identity ? identity.toClientDTO() : null;
    });

    ipcMain.handle(Ch.CHECK_AUTH, async (_event, identityId: string) => {
      if (!identityId) return false;
      const identity = await identityRepository.findById(identityId);
      return identity !== null;
    });

    logger.info('Authentication module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    AuthenticationContainer.getInstance().reset();
    logger.info('Authentication module destroyed');
  },
};

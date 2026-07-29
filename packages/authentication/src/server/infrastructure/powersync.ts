/**
 * Authentication Module — PowerSync convenience factory.
 * 认证模块 — PowerSync 便捷工厂。
 *
 * Creates an AuthenticationModuleInstance with PowerSync repositories
 * for use in Electron main process (desktop offline-first runtime).
 *
 * 为 Electron 主进程（桌面离线优先运行时）创建使用 PowerSync 仓储的认证模块实例。
 */

import {
  createAuthenticationModule,
  type AuthenticationModuleInstance,
} from './authentication.module';
import {
  PowerSyncAuthIdentityRepository,
  PowerSyncAuthSessionRepository,
} from './adapters/powersync';
import { Argon2Hasher } from './encryptors/argon2-hasher';
import type { IElectronDatabase } from '@memoflow/contracts/electron';
import type { ITokenProvider } from '../domain/services/token-provider.interface';

export interface AuthenticationPowerSyncModuleOptions {
  readonly db: IElectronDatabase;
  readonly tokenProvider: ITokenProvider;
}

export function createAuthenticationPowerSyncModule(
  options: AuthenticationPowerSyncModuleOptions,
): AuthenticationModuleInstance {
  return createAuthenticationModule({
    identityRepository: new PowerSyncAuthIdentityRepository(options.db),
    sessionRepository: new PowerSyncAuthSessionRepository(options.db),
    passwordHasher: new Argon2Hasher(),
    tokenProvider: options.tokenProvider,
  });
}

export { PowerSyncAuthIdentityRepository, PowerSyncAuthSessionRepository };

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

export interface CreateAuthenticationPrismaModuleOptions {
  readonly tokenProvider: ITokenProvider;
  readonly passwordHasher?: IPasswordHasher;
  readonly runtimeContributions?:
    | AuthenticationModuleRuntimeContribution
    | readonly AuthenticationModuleRuntimeContribution[];
}

export function createAuthenticationPrismaModule(
  db: PrismaClient,
  options: CreateAuthenticationPrismaModuleOptions,
): AuthenticationModuleInstance {
  const eventBusAdapter = createEventBusAdapter(eventBus);

  return createAuthenticationModule({
    identityRepository: new PrismaAuthIdentityRepository(db, eventBusAdapter),
    sessionRepository: new PrismaAuthSessionRepository(db, eventBusAdapter),
    passwordHasher: options.passwordHasher ?? new Argon2Hasher(),
    tokenProvider: options.tokenProvider,
    runtimeContributions: options.runtimeContributions,
  });
}

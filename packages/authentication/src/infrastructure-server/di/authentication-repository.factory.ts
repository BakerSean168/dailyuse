/**
 * Authentication Repository Factory
 *
 * Creates repository instances based on dataSourceType ('prisma' | 'powersync').
 * Keeps authentication's current server/desktop split localized to this module.
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IAuthIdentityRepository, IAuthSessionRepository } from '../../domain-server';
import type { IEventBus } from '@dailyuse/patterns';
import { PrismaAuthIdentityRepository, PrismaAuthSessionRepository } from '../adapters/prisma';
import {
  PowerSyncAuthIdentityRepository,
  PowerSyncAuthSessionRepository,
} from '../adapters/powersync';

export type DataSourceType = 'prisma' | 'powersync';

export interface AuthenticationRepositories {
  identityRepository: IAuthIdentityRepository;
  sessionRepository: IAuthSessionRepository;
}

export class AuthenticationRepositoryFactory {
  static createIdentityRepository(
    dataSourceType: DataSourceType,
    dbConnection: PrismaClient | IElectronDatabase,
    eventBus?: IEventBus,
  ): IAuthIdentityRepository {
    switch (dataSourceType) {
      case 'prisma':
        if (!eventBus) throw new Error('eventBus is required for Prisma identity repository');
        return new PrismaAuthIdentityRepository(dbConnection as PrismaClient, eventBus);
      case 'powersync':
        return new PowerSyncAuthIdentityRepository(dbConnection as IElectronDatabase);
      default:
        throw new Error(`Unsupported dataSourceType: ${dataSourceType}`);
    }
  }

  static createSessionRepository(
    dataSourceType: DataSourceType,
    dbConnection: PrismaClient | IElectronDatabase,
    eventBus?: IEventBus,
  ): IAuthSessionRepository {
    switch (dataSourceType) {
      case 'prisma':
        if (!eventBus) throw new Error('eventBus is required for Prisma session repository');
        return new PrismaAuthSessionRepository(dbConnection as PrismaClient, eventBus);
      case 'powersync':
        return new PowerSyncAuthSessionRepository(dbConnection as IElectronDatabase);
      default:
        throw new Error(`Unsupported dataSourceType: ${dataSourceType}`);
    }
  }

  static createAllRepositories(
    dataSourceType: DataSourceType,
    dbConnection: PrismaClient | IElectronDatabase,
    eventBus?: IEventBus,
  ): AuthenticationRepositories {
    return {
      identityRepository: this.createIdentityRepository(dataSourceType, dbConnection, eventBus),
      sessionRepository: this.createSessionRepository(dataSourceType, dbConnection, eventBus),
    };
  }
}

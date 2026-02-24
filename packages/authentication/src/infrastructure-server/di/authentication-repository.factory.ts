/**
 * Authentication Repository Factory
 *
 * Creates repository instances based on dataSourceType ('prisma' | 'sqlite').
 * Follows the same pattern as TaskRepositoryFactory / ReminderRepositoryFactory.
 */

import type { PrismaClient } from '@dailyuse/database';
import type Database from 'better-sqlite3';
import type { IAuthIdentityRepository, IAuthSessionRepository } from '../../domain-server';
import type { IEventBus } from '@dailyuse/patterns';
import { PrismaAuthIdentityRepository, PrismaAuthSessionRepository } from '../adapters/prisma';
import {
	SqliteAuthIdentityRepository,
	SqliteAuthSessionRepository,
} from '../adapters/sqlite';

export type DataSourceType = 'prisma' | 'sqlite';

export interface AuthenticationRepositories {
	identityRepository: IAuthIdentityRepository;
	sessionRepository: IAuthSessionRepository;
}

export class AuthenticationRepositoryFactory {
	static createIdentityRepository(
		dataSourceType: DataSourceType,
		dbConnection: PrismaClient | Database.Database,
		eventBus?: IEventBus,
	): IAuthIdentityRepository {
		switch (dataSourceType) {
			case 'prisma':
				if (!eventBus) throw new Error('eventBus is required for Prisma identity repository');
				return new PrismaAuthIdentityRepository(dbConnection as PrismaClient, eventBus);
			case 'sqlite':
				return new SqliteAuthIdentityRepository(dbConnection as Database.Database);
			default:
				throw new Error(`Unsupported dataSourceType: ${dataSourceType}`);
		}
	}

	static createSessionRepository(
		dataSourceType: DataSourceType,
		dbConnection: PrismaClient | Database.Database,
		eventBus?: IEventBus,
	): IAuthSessionRepository {
		switch (dataSourceType) {
			case 'prisma':
				if (!eventBus) throw new Error('eventBus is required for Prisma session repository');
				return new PrismaAuthSessionRepository(dbConnection as PrismaClient, eventBus);
			case 'sqlite':
				return new SqliteAuthSessionRepository(dbConnection as Database.Database);
			default:
				throw new Error(`Unsupported dataSourceType: ${dataSourceType}`);
		}
	}

	static createAllRepositories(
		dataSourceType: DataSourceType,
		dbConnection: PrismaClient | Database.Database,
		eventBus?: IEventBus,
	): AuthenticationRepositories {
		return {
			identityRepository: this.createIdentityRepository(dataSourceType, dbConnection, eventBus),
			sessionRepository: this.createSessionRepository(dataSourceType, dbConnection, eventBus),
		};
	}
}

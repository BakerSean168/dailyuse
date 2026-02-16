import type Database from 'better-sqlite3';
import type { IRepositoryStatisticsRepository } from '../../../domain-server/repositories/IRepositoryStatisticsRepository';

/**
 * SQLite implementation of IRepositoryStatisticsRepository (stub).
 * TODO: Implement actual statistics queries.
 */
export class SqliteRepositoryStatisticsRepository implements IRepositoryStatisticsRepository {
  constructor(private readonly db: Database.Database) {}
}

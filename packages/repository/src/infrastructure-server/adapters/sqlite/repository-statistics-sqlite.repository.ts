import type Database from 'better-sqlite3';
import type { IRepositoryStatisticsRepository } from '../../../domain-server/repositories/IRepositoryStatisticsRepository';

export class SqliteRepositoryStatisticsRepository implements IRepositoryStatisticsRepository {
  constructor(private readonly db: Database.Database) {
    void this.db;
  }
}
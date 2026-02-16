import type Database from 'better-sqlite3';
import type { IScheduleStatisticsRepository } from '../../../domain-server/repositories/IScheduleStatisticsRepository';

/**
 * SQLite implementation of IScheduleStatisticsRepository (stub).
 * TODO: Implement actual statistics queries.
 */
export class SqliteScheduleStatisticsRepository implements IScheduleStatisticsRepository {
  constructor(private readonly db: Database.Database) {}
}

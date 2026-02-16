/**
 * SQLite Schedule Repository - Placeholder
 * The actual implementation uses Prisma
 */

import type Database from 'better-sqlite3';
import type { Schedule } from '../../../domain-server/aggregates/schedule';
import type { IScheduleRepository } from '../../../domain-server/repositories/IScheduleRepository';

export class SqliteScheduleRepository implements IScheduleRepository {
  constructor(private db: Database.Database) {}

  async save(schedule: Schedule): Promise<void> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async findById(id: string): Promise<Schedule | null> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async findById(id: string): Promise<Schedule | null> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async delete(id: string): Promise<void> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async findAll(identityId: string): Promise<Schedule[]> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async findByAccountId(identityId: string): Promise<Schedule[]> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async findByDateRange(identityId: string, startTime: number, endTime: number): Promise<Schedule[]> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async deleteById(id: string): Promise<void> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async findByTimeRange(identityId: string, startTime: number, endTime: number): Promise<Schedule[]> {
    throw new Error('SQLite Schedule Repository not implemented');
  }
}



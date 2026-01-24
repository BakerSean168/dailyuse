/**
 * SQLite Schedule Repository - Placeholder
 * The actual implementation uses Prisma
 */

import type Database from 'better-sqlite3';
import type { Schedule } from '@dailyuse/domain-server/schedule';
import type { IScheduleRepository } from '@dailyuse/domain-server/schedule';

export class SqliteScheduleRepository implements IScheduleRepository {
  constructor(private db: Database.Database) {}

  async save(schedule: Schedule): Promise<void> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async findById(uuid: string): Promise<Schedule | null> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async findByUuid(uuid: string): Promise<Schedule | null> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async findAll(accountUuid: string): Promise<Schedule[]> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async findByAccountUuid(accountUuid: string): Promise<Schedule[]> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async findByDateRange(accountUuid: string, startTime: number, endTime: number): Promise<Schedule[]> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async deleteByUuid(uuid: string): Promise<void> {
    throw new Error('SQLite Schedule Repository not implemented');
  }

  async findByTimeRange(accountUuid: string, startTime: number, endTime: number): Promise<Schedule[]> {
    throw new Error('SQLite Schedule Repository not implemented');
  }
}



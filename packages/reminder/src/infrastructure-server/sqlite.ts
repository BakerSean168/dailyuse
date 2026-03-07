/**
 * Reminder Module - SQLite Composition Root
 */

import type Database from 'better-sqlite3';
import type { IReminderTemplateRepository } from '../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../domain-server/repositories/IReminderGroupRepository';
import type { IReminderResponseRepository } from '../domain-server/repositories/IReminderResponseRepository';
import type { IUserReminderPreferenceRepository } from '../domain-server/repositories/IUserReminderPreferenceRepository';
import { ReminderContainer } from './di/reminder-container';
import {
  SqliteReminderTemplateRepository,
  SqliteReminderGroupRepository,
  SqliteReminderResponseRepository,
  UserReminderPreferenceSqliteRepository,
} from './adapters/sqlite';

type BetterSQLiteDB = Database.Database;

export class ReminderSqliteModule {
  public readonly reminderTemplateRepository: IReminderTemplateRepository;
  public readonly reminderGroupRepository: IReminderGroupRepository;
  public readonly reminderResponseRepository: IReminderResponseRepository;
  public readonly userReminderPreferenceRepository: IUserReminderPreferenceRepository;

  constructor(dbConnection: BetterSQLiteDB) {
    const reminderTemplateRepository = new SqliteReminderTemplateRepository(dbConnection);
    const reminderGroupRepository = new SqliteReminderGroupRepository(dbConnection);
    const reminderResponseRepository = new SqliteReminderResponseRepository(dbConnection);
    const userReminderPreferenceRepository = new UserReminderPreferenceSqliteRepository(
      dbConnection,
    );

    const container = ReminderContainer.getInstance();
    container.reset();
    container.setReminderTemplateRepository(reminderTemplateRepository);
    container.setReminderGroupRepository(reminderGroupRepository);
    container.setReminderResponseRepository(reminderResponseRepository);
    container.setUserReminderPreferenceRepository(userReminderPreferenceRepository);

    this.reminderTemplateRepository = container.getReminderTemplateRepository();
    this.reminderGroupRepository = container.getReminderGroupRepository();
    this.reminderResponseRepository = container.getReminderResponseRepository();
    this.userReminderPreferenceRepository = userReminderPreferenceRepository;
  }
}

export {
  SqliteReminderTemplateRepository,
  SqliteReminderGroupRepository,
  SqliteReminderResponseRepository,
  UserReminderPreferenceSqliteRepository,
} from './adapters/sqlite';
export { REMINDER_MODULE_SCHEMA } from './adapters/sqlite/schema';
export { ReminderContainer } from './di/reminder-container';

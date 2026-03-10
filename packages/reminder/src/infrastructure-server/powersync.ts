import type { IReminderTemplateRepository } from '../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../domain-server/repositories/IReminderGroupRepository';
import type { IReminderResponseRepository } from '../domain-server/repositories/IReminderResponseRepository';
import type { IUserReminderPreferenceRepository } from '../domain-server/repositories/IUserReminderPreferenceRepository';
import { ReminderContainer } from './di/reminder-container';
import {
  ReminderTemplatePowerSyncRepository,
  ReminderGroupPowerSyncRepository,
  ReminderResponsePowerSyncRepository,
  UserReminderPreferencePowerSyncRepository,
} from './adapters/powersync';

type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  get<T>(sql: string, parameters?: unknown[]): Promise<T>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

export class ReminderPowerSyncModule {
  public readonly reminderTemplateRepository: IReminderTemplateRepository;
  public readonly reminderGroupRepository: IReminderGroupRepository;
  public readonly reminderResponseRepository: IReminderResponseRepository;
  public readonly userReminderPreferenceRepository: IUserReminderPreferenceRepository;

  constructor(dbConnection: Queryable) {
    const reminderTemplateRepository = new ReminderTemplatePowerSyncRepository(dbConnection);
    const reminderGroupRepository = new ReminderGroupPowerSyncRepository(dbConnection);
    const reminderResponseRepository = new ReminderResponsePowerSyncRepository(dbConnection);
    const userReminderPreferenceRepository = new UserReminderPreferencePowerSyncRepository(
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
  ReminderTemplatePowerSyncRepository,
  ReminderGroupPowerSyncRepository,
  ReminderResponsePowerSyncRepository,
  UserReminderPreferencePowerSyncRepository,
  ReminderContainer,
};

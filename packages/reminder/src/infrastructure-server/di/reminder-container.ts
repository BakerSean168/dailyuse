import type { IReminderTemplateRepository } from '../../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../../domain-server/repositories/IReminderGroupRepository';
import type { IReminderResponseRepository } from '../../domain-server/repositories/IReminderResponseRepository';
import type { IUserReminderPreferenceRepository } from '../../domain-server/repositories/IUserReminderPreferenceRepository';

export class ReminderContainer {
  private static instance: ReminderContainer;
  private reminderTemplateRepository?: IReminderTemplateRepository;
  private reminderGroupRepository?: IReminderGroupRepository;
  private reminderResponseRepository?: IReminderResponseRepository;
  private userReminderPreferenceRepository?: IUserReminderPreferenceRepository;

  private constructor() {}

  static getInstance(): ReminderContainer {
    if (!ReminderContainer.instance) {
      ReminderContainer.instance = new ReminderContainer();
    }
    return ReminderContainer.instance;
  }

  setReminderTemplateRepository(repository: IReminderTemplateRepository): void {
    this.reminderTemplateRepository = repository;
  }

  setReminderGroupRepository(repository: IReminderGroupRepository): void {
    this.reminderGroupRepository = repository;
  }

  setReminderResponseRepository(repository: IReminderResponseRepository): void {
    this.reminderResponseRepository = repository;
  }

  setUserReminderPreferenceRepository(repository: IUserReminderPreferenceRepository): void {
    this.userReminderPreferenceRepository = repository;
  }

  getReminderTemplateRepository(): IReminderTemplateRepository {
    if (!this.reminderTemplateRepository) {
      throw new Error('ReminderTemplateRepository not registered in ReminderContainer');
    }
    return this.reminderTemplateRepository;
  }

  getReminderGroupRepository(): IReminderGroupRepository {
    if (!this.reminderGroupRepository) {
      throw new Error('ReminderGroupRepository not registered in ReminderContainer');
    }
    return this.reminderGroupRepository;
  }

  getReminderResponseRepository(): IReminderResponseRepository {
    if (!this.reminderResponseRepository) {
      throw new Error('ReminderResponseRepository not registered in ReminderContainer');
    }
    return this.reminderResponseRepository;
  }

  getUserReminderPreferenceRepository(): IUserReminderPreferenceRepository {
    if (!this.userReminderPreferenceRepository) {
      throw new Error('UserReminderPreferenceRepository not registered in ReminderContainer');
    }
    return this.userReminderPreferenceRepository;
  }

  reset(): void {
    this.reminderTemplateRepository = undefined;
    this.reminderGroupRepository = undefined;
    this.reminderResponseRepository = undefined;
    this.userReminderPreferenceRepository = undefined;
  }
}

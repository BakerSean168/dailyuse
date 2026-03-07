/**
 * Notification Module - SQLite Composition Root
 */

import type {
  INotificationPreferenceRepository,
  INotificationRepository,
  INotificationTemplateRepository,
} from '../domain-server/repositories';
import {
  NotificationApplicationService,
  NotificationTemplateApplicationService,
  NotificationChannelApplicationService,
} from '../application-server/use-cases/commands/notification-application-services';
import { NotificationContainer } from './di/notification-container';
import {
  SqliteNotificationRepository,
  SqliteNotificationPreferenceRepository,
  SqliteNotificationTemplateRepository,
} from './adapters/sqlite';

type BetterSQLiteDB = any;

export class NotificationSqliteModule {
  public readonly notificationRepository: INotificationRepository;
  public readonly notificationPreferenceRepository: INotificationPreferenceRepository;
  public readonly notificationTemplateRepository: INotificationTemplateRepository;

  public readonly notificationService: NotificationApplicationService;
  public readonly notificationTemplateService: NotificationTemplateApplicationService;
  public readonly notificationChannelService: NotificationChannelApplicationService;

  constructor(dbConnection: BetterSQLiteDB) {
    const notificationRepository = new SqliteNotificationRepository(dbConnection);
    const notificationPreferenceRepository = new SqliteNotificationPreferenceRepository(
      dbConnection,
    );
    const notificationTemplateRepository = new SqliteNotificationTemplateRepository(dbConnection);

    const container = NotificationContainer.getInstance();
    container.reset();
    container.setNotificationRepository(notificationRepository);
    container.setNotificationPreferenceRepository(notificationPreferenceRepository);
    container.setNotificationTemplateRepository(notificationTemplateRepository);

    this.notificationRepository = container.getNotificationRepository();
    this.notificationPreferenceRepository = container.getNotificationPreferenceRepository();
    this.notificationTemplateRepository = container.getNotificationTemplateRepository();

    this.notificationService = new NotificationApplicationService();
    this.notificationTemplateService = new NotificationTemplateApplicationService();
    this.notificationChannelService = new NotificationChannelApplicationService();
  }
}

export {
  SqliteNotificationRepository,
  SqliteNotificationPreferenceRepository,
  SqliteNotificationTemplateRepository,
  NotificationContainer,
};

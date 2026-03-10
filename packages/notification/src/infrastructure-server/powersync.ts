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
  PowerSyncNotificationRepository,
  PowerSyncNotificationPreferenceRepository,
  PowerSyncNotificationTemplateRepository,
} from './adapters/powersync';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';

export class NotificationPowerSyncModule {
  public readonly notificationRepository: INotificationRepository;
  public readonly notificationPreferenceRepository: INotificationPreferenceRepository;
  public readonly notificationTemplateRepository: INotificationTemplateRepository;

  public readonly notificationService: NotificationApplicationService;
  public readonly notificationTemplateService: NotificationTemplateApplicationService;
  public readonly notificationChannelService: NotificationChannelApplicationService;

  constructor(dbConnection: IElectronDatabase) {
    const notificationRepository = new PowerSyncNotificationRepository(dbConnection);
    const notificationPreferenceRepository = new PowerSyncNotificationPreferenceRepository(
      dbConnection,
    );
    const notificationTemplateRepository = new PowerSyncNotificationTemplateRepository(
      dbConnection,
    );

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
  PowerSyncNotificationRepository,
  PowerSyncNotificationPreferenceRepository,
  PowerSyncNotificationTemplateRepository,
  NotificationContainer,
};

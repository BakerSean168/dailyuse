import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { anIdentityId } from '@dailyuse/test-utils/fixtures';
import type { INotificationRepository } from '@/domain-server/repositories/INotificationRepository';
import { GetUserNotifications } from '../get-user-notifications';
import { Notification } from '@/domain-server/aggregates/notification';
import { NotificationType, NotificationCategory } from '@dailyuse/contracts/notification';

describe('GetUserNotifications', () => {
  let notificationRepo: ReturnType<typeof createMockRepo<INotificationRepository>>;
  let useCase: GetUserNotifications;

  function aNotification(identityId: string) {
    return Notification.create({
      identityId,
      title: 'Test',
      content: 'Content',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();

    notificationRepo = createMockRepo<INotificationRepository>({
      findByIdentityId: vi.fn().mockResolvedValue([]),
    });

    useCase = new GetUserNotifications(notificationRepo);
  });

  it('should return an empty array when no notifications exist', async () => {
    const result = await useCase.execute(anIdentityId());

    expect(result).toEqual([]);
  });

  it('should return client DTOs for found notifications', async () => {
    const identityId = anIdentityId();
    const notifications = [aNotification(identityId), aNotification(identityId)];
    vi.mocked(notificationRepo.findByIdentityId).mockResolvedValue(notifications);

    const result = await useCase.execute(identityId);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Test');
    expect(result[0].id).toBeTruthy();
  });

  it('should pass includeRead=true by default', async () => {
    const identityId = anIdentityId();

    await useCase.execute(identityId);

    expect(notificationRepo.findByIdentityId).toHaveBeenCalledWith(identityId, {
      includeRead: true,
      includeDeleted: false,
      limit: undefined,
      offset: undefined,
    });
  });

  it('should forward includeRead=false when specified', async () => {
    const identityId = anIdentityId();

    await useCase.execute(identityId, { includeRead: false });

    expect(notificationRepo.findByIdentityId).toHaveBeenCalledWith(identityId, {
      includeRead: false,
      includeDeleted: false,
      limit: undefined,
      offset: undefined,
    });
  });

  it('should forward limit and offset options', async () => {
    const identityId = anIdentityId();

    await useCase.execute(identityId, { limit: 10, offset: 5 });

    expect(notificationRepo.findByIdentityId).toHaveBeenCalledWith(identityId, {
      includeRead: true,
      includeDeleted: false,
      limit: 10,
      offset: 5,
    });
  });
});

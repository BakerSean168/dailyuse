import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { anIdentityId } from '@memoflow/test-utils/fixtures';
import { NotificationCategory, NotificationType } from '@memoflow/contracts/notification';
import type { INotificationRepository } from '../../../../domain/repositories';
import { Notification } from '../../../../domain/aggregates/notification';
import { UpdateNotificationUseCase } from '../update-notification.use-case';

function aFact() {
  return Notification.create({
    identityId: anIdentityId(),
    workflowKey: 'system.general',
    topic: 'system.general',
    idempotencyKey: 'update-fact-1',
    title: 'Original title',
    content: 'Original content',
    type: NotificationType.Info,
    category: NotificationCategory.System,
  });
}

describe('UpdateNotificationUseCase — Fact-only mutation', () => {
  let notificationRepo: ReturnType<typeof createMockRepo<INotificationRepository>>;
  let useCase: UpdateNotificationUseCase;
  beforeEach(() => {
    notificationRepo = createMockRepo<INotificationRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new UpdateNotificationUseCase(notificationRepo);
  });

  it('updates Fact-owned mutable fields and never exposes root delivery status', async () => {
    const fact = aFact();
    vi.mocked(notificationRepo.findByIdForIdentity).mockResolvedValue(fact);
    const expiresAt = Date.now() + 60_000;
    const result = await useCase.execute(String(fact.id), String(fact.identityId), {
      title: 'Updated title',
      content: 'Updated content',
      navigationIntent: { route: '/inbox', params: { focus: '1' } },
      metadata: { icon: 'bell', badge: 3 },
      expiresAt,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.data).toMatchObject({
      title: 'Updated title',
      content: 'Updated content',
      navigationIntent: { route: '/inbox', params: { focus: '1' } },
      expiresAt,
    });
    expect(result.data).not.toHaveProperty('status');
    expect(notificationRepo.save).toHaveBeenCalledWith(fact);
  });

  it('returns NOT_FOUND when the owned Fact does not exist', async () => {
    vi.mocked(notificationRepo.findByIdForIdentity).mockResolvedValue(null);
    const result = await useCase.execute('missing-id', anIdentityId(), { title: 'Nope' });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('NOT_FOUND');
  });
});

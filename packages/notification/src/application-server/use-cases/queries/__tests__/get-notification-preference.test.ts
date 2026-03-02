import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { anIdentityId } from '@dailyuse/test-utils/fixtures';
import type { INotificationPreferenceRepository } from '@/domain-server/repositories/INotificationPreferenceRepository';
import { GetNotificationPreference } from '../get-notification-preference';
import { NotificationPreference } from '@/domain-server/aggregates/notification-preference';
import { NotificationChannelType } from '@dailyuse/contracts/notification';

describe('GetNotificationPreference', () => {
  let preferenceRepo: ReturnType<typeof createMockRepo<INotificationPreferenceRepository>>;
  let useCase: GetNotificationPreference;

  beforeEach(() => {
    vi.clearAllMocks();

    preferenceRepo = createMockRepo<INotificationPreferenceRepository>({
      findByIdentityId: vi.fn().mockResolvedValue(null),
      getOrCreate: vi.fn(),
    });

    useCase = new GetNotificationPreference(preferenceRepo);
  });

  describe('execute()', () => {
    it('should return null when no preference exists', async () => {
      vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(null);

      const result = await useCase.execute(anIdentityId());

      expect(result).toBeNull();
    });

    it('should return a client DTO when preference exists', async () => {
      const identityId = anIdentityId();
      const pref = NotificationPreference.create({
        identityId,
        defaultChannels: [NotificationChannelType.InApp],
      });
      vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(pref);

      const result = await useCase.execute(identityId);

      expect(result).toBeDefined();
      expect(result!.identityId).toBe(identityId);
      expect(result!.settings).toBeDefined();
      expect(result!.settings['task']).toEqual([NotificationChannelType.InApp]);
    });

    it('should call findByIdentityId on repository', async () => {
      const identityId = anIdentityId();

      await useCase.execute(identityId);

      expect(preferenceRepo.findByIdentityId).toHaveBeenCalledWith(identityId);
    });
  });

  describe('executeOrCreate()', () => {
    it('should return a client DTO from getOrCreate', async () => {
      const identityId = anIdentityId();
      const pref = NotificationPreference.create({
        identityId,
        defaultChannels: [NotificationChannelType.InApp, NotificationChannelType.Email],
      });
      vi.mocked(preferenceRepo.getOrCreate).mockResolvedValue(pref);

      const result = await useCase.executeOrCreate(identityId);

      expect(result).toBeDefined();
      expect(result.identityId).toBe(identityId);
      expect(result.settings['task']).toContain(NotificationChannelType.InApp);
      expect(result.settings['task']).toContain(NotificationChannelType.Email);
    });

    it('should call getOrCreate on repository', async () => {
      const identityId = anIdentityId();
      const pref = NotificationPreference.create({ identityId });
      vi.mocked(preferenceRepo.getOrCreate).mockResolvedValue(pref);

      await useCase.executeOrCreate(identityId);

      expect(preferenceRepo.getOrCreate).toHaveBeenCalledWith(identityId);
    });

    it('should always return a non-null result', async () => {
      const identityId = anIdentityId();
      const pref = NotificationPreference.create({ identityId });
      vi.mocked(preferenceRepo.getOrCreate).mockResolvedValue(pref);

      const result = await useCase.executeOrCreate(identityId);

      expect(result).not.toBeNull();
      expect(result.id).toBeTruthy();
      expect(typeof result.createdAt).toBe('number');
    });
  });
});

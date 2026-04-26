import { NotificationPreferenceDomainService } from '../NotificationPreferenceDomainService';

function createRepository() {
  return {
    findByIdentityId: vi.fn(),
    getOrCreate: vi.fn(),
  };
}

describe('NotificationPreferenceDomainService', () => {
  it('delegates preference reads to the repository', async () => {
    const repo = createRepository();
    const preference = { id: 'pref-1' };
    repo.findByIdentityId.mockResolvedValue(preference);
    repo.getOrCreate.mockResolvedValue(preference);

    const service = new NotificationPreferenceDomainService(repo as never);

    await expect(service.getPreference('identity-1')).resolves.toBe(preference);
    await expect(service.getOrCreatePreference('identity-1')).resolves.toBe(preference);

    expect(repo.findByIdentityId).toHaveBeenCalledWith('identity-1');
    expect(repo.getOrCreate).toHaveBeenCalledWith('identity-1');
  });
});

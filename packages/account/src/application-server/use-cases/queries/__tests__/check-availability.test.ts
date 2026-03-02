import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAccountRepository } from '@/domain-server/repositories/i-account-repository';
import { CheckAvailabilityUseCase } from '../check-availability';

describe('CheckAvailabilityUseCase', () => {
  let repo: ReturnType<typeof createMockRepo<IAccountRepository>>;
  let useCase: CheckAvailabilityUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IAccountRepository>();
    useCase = new CheckAvailabilityUseCase(repo);
  });

  describe('EMAIL type', () => {
    it('should return available=true when email does not exist', async () => {
      (repo.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await useCase.execute({ type: 'EMAIL', value: 'new@example.com' });

      expect(result.available).toBe(true);
      expect(repo.existsByEmail).toHaveBeenCalledWith('new@example.com');
    });

    it('should return available=false when email already exists', async () => {
      (repo.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await useCase.execute({ type: 'EMAIL', value: 'taken@example.com' });

      expect(result.available).toBe(false);
    });
  });

  describe('NICKNAME type', () => {
    it('should return available=true when username does not exist', async () => {
      (repo.existsByUsername as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await useCase.execute({ type: 'NICKNAME', value: 'newuser' });

      expect(result.available).toBe(true);
      expect(repo.existsByUsername).toHaveBeenCalledWith('newuser');
    });

    it('should return available=false when username already exists', async () => {
      (repo.existsByUsername as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await useCase.execute({ type: 'NICKNAME', value: 'takenuser' });

      expect(result.available).toBe(false);
    });
  });

  describe('unknown type', () => {
    it('should return available=false for unrecognized type', async () => {
      const result = await useCase.execute({ type: 'PHONE' as any, value: '12345' });

      expect(result.available).toBe(false);
    });
  });
});

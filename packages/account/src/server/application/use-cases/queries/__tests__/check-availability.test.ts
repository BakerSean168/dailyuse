import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAccountRepository } from '../../../../domain/repositories/i-account-repository';
import { CheckAvailabilityUseCase } from '../check-availability.use-case';

describe('CheckAvailabilityUseCase', () => {
  let repo: ReturnType<typeof createMockRepo<IAccountRepository>>;
  let useCase: CheckAvailabilityUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IAccountRepository>();
    useCase = new CheckAvailabilityUseCase(repo);
  });

  describe('email field', () => {
    it('should return available=true when email does not exist', async () => {
      (repo.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await useCase.execute({ type: 'email', value: 'new@example.com' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.available).toBe(true);
      }
      expect(repo.existsByEmail).toHaveBeenCalledWith('new@example.com');
    });

    it('should return available=false when email already exists', async () => {
      (repo.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await useCase.execute({ type: 'email', value: 'taken@example.com' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.available).toBe(false);
      }
    });
  });

  describe('nickname field', () => {
    it('should return available=true when nickname does not exist', async () => {
      (repo.existsByNickname as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await useCase.execute({ type: 'nickname', value: 'newuser' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.available).toBe(true);
      }
      expect(repo.existsByNickname).toHaveBeenCalledWith('newuser');
    });

    it('should return available=false when nickname already exists', async () => {
      (repo.existsByNickname as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await useCase.execute({ type: 'nickname', value: 'takenuser' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.available).toBe(false);
      }
    });
  });

  describe('unknown type', () => {
    it('should return available=false for unrecognized type', async () => {
      const result = await useCase.execute({ type: 'PHONE' as any, value: '12345' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.available).toBe(false);
      }
    });
  });
});

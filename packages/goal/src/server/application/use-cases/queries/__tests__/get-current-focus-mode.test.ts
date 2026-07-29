import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils';
import type { IFocusModeRepository } from '../../../../domain';
import { GetCurrentFocusModeUseCase } from '../get-current-focus-mode.use-case';

function createFocusModeFixture(overrides?: Record<string, any>) {
  const dto = {
    id: overrides?.id ?? 'focus-1',
    isActive: true,
    remainingDays: 3,
  };
  return {
    id: overrides?.id ?? 'focus-1',
    isActive: overrides?.isActive ?? true,
    getRemainingDays: vi.fn().mockReturnValue(overrides?.remainingDays ?? 3),
    toDTO: vi.fn().mockReturnValue({
      id: dto.id,
      isActive: dto.isActive,
    }),
    ...overrides,
  } as any;
}

describe('GetCurrentFocusModeUseCase', () => {
  it('should return active focus mode dto', async () => {
    const focusMode = createFocusModeFixture({ id: 'focus-1', remainingDays: 5 });
    const findActiveByIdentityId = vi.fn().mockResolvedValue(focusMode);
    const focusModeRepo = createMockRepo<IFocusModeRepository>({
      findActiveByIdentityId,
    });
    const useCase = new GetCurrentFocusModeUseCase(focusModeRepo);

    const result = await useCase.execute('identity-1');

    expect(findActiveByIdentityId).toHaveBeenCalledWith('identity-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({ id: 'focus-1', isActive: true });
    expect(focusMode.toDTO).toHaveBeenCalled();
  });

  it('should return null when no active focus mode exists', async () => {
    const focusModeRepo = createMockRepo<IFocusModeRepository>({
      findActiveByIdentityId: vi.fn().mockResolvedValue(null),
    });
    const useCase = new GetCurrentFocusModeUseCase(focusModeRepo);

    const result = await useCase.execute('identity-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toBeNull();
  });
});

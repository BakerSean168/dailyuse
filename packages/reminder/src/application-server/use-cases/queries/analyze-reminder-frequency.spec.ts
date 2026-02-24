import { describe, it, expect, vi } from 'vitest';
import { AnalyzeReminderFrequency } from './analyze-reminder-frequency';
import type { IReminderTemplateRepository } from '@/domain-server/repositories/IReminderTemplateRepository';
import type { IReminderResponseRepository } from '@/domain-server/repositories/IReminderResponseRepository';

describe('AnalyzeReminderFrequency Performance Benchmark', () => {
  it('measures N+1 calls in executeGlobal', async () => {
    // Mock repositories
    const mockTemplates = [
      { id: 't1' },
      { id: 't2' },
      { id: 't3' },
    ];

    const mockTemplateRepo = {
      findById: vi.fn().mockImplementation((id) => Promise.resolve(mockTemplates.find(t => t.id === id))),
      findByIdentityId: vi.fn().mockResolvedValue(mockTemplates),
    } as unknown as IReminderTemplateRepository;

    const mockResponseRepo = {} as unknown as IReminderResponseRepository;

    const service = new AnalyzeReminderFrequency(mockTemplateRepo, mockResponseRepo);

    // Baseline Measurement
    await service.executeGlobal('user-1');

    // Currently expect findById to be called 3 times (N=3)
    // After optimization, this should be 0.
    expect(mockTemplateRepo.findById).toHaveBeenCalledTimes(0);
  });
});

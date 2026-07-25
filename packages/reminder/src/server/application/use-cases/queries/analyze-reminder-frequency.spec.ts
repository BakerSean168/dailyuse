import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyzeReminderFrequencyUseCase } from './analyze-reminder-frequency.use-case';

type Stats = {
  total: number;
  clicked: number;
  ignored: number;
  snoozed: number;
  dismissed: number;
  completed: number;
  avgResponseTime: number;
};

function stats(overrides: Partial<Stats> = {}): Stats {
  return {
    total: 0,
    clicked: 0,
    ignored: 0,
    snoozed: 0,
    dismissed: 0,
    completed: 0,
    avgResponseTime: 0,
    ...overrides,
  };
}

describe('AnalyzeReminderFrequencyUseCase', () => {
  const templateRepository = {
    findByIdForIdentity: vi.fn(),
    findByIdentityId: vi.fn(),
  } as any;

  const responseRepository = {
    getResponseStats: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns NOT_FOUND when template is not found', async () => {
    templateRepository.findByIdForIdentity.mockResolvedValue(null);
    const useCase = new AnalyzeReminderFrequencyUseCase(templateRepository, responseRepository);

    const result = await useCase.execute('tpl-1', 'identity-1');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('queries the response repository with the requested lookback window', async () => {
    templateRepository.findByIdForIdentity.mockResolvedValue({ id: 'tpl-1', identityId: 'identity-1' });
    responseRepository.getResponseStats.mockResolvedValue(stats());
    const useCase = new AnalyzeReminderFrequencyUseCase(templateRepository, responseRepository);

    await useCase.execute('tpl-1', 'identity-1', 7);

    expect(responseRepository.getResponseStats).toHaveBeenCalledWith('tpl-1', 'identity-1', 7);
  });

  it('returns null when the template has no recorded responses', async () => {
    templateRepository.findByIdForIdentity.mockResolvedValue({ id: 'tpl-1', identityId: 'identity-1' });
    responseRepository.getResponseStats.mockResolvedValue(stats());
    const useCase = new AnalyzeReminderFrequencyUseCase(templateRepository, responseRepository);

    const result = await useCase.execute('tpl-1', 'identity-1', 7);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBeNull();
    }
  });

  it('computes metrics from the aggregated response stats', async () => {
    templateRepository.findByIdForIdentity.mockResolvedValue({ id: 'tpl-1', identityId: 'identity-1' });
    responseRepository.getResponseStats.mockResolvedValue(
      stats({
        total: 10,
        clicked: 5,
        ignored: 2,
        snoozed: 1,
        dismissed: 0,
        completed: 2,
        avgResponseTime: 1200,
      }),
    );
    const useCase = new AnalyzeReminderFrequencyUseCase(templateRepository, responseRepository);

    const result = await useCase.execute('tpl-1', 'identity-1', 30);

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
      expect(result.data.sampleSize).toBe(10);
      expect(result.data.clickRate).toBeCloseTo(0.5);
      expect(result.data.ignoreRate).toBeCloseTo(0.2);
      expect(result.data.snoozeCount).toBe(1);
      expect(result.data.avgResponseTime).toBe(1200);
      // effectivenessScore = 0.5*0.6 + (1-0.2)*0.2 + 0.2*0.2 = 0.3 + 0.16 + 0.04 = 0.5
      expect(result.data.effectivenessScore).toBeCloseTo(0.5);
    }
  });

  it('builds a global report by analyzing every template of an identity', async () => {
    const templates = [{ id: 't1', identityId: 'identity-1' }, { id: 't2', identityId: 'identity-1' }, { id: 't3', identityId: 'identity-1' }];
    templateRepository.findByIdentityId.mockResolvedValue(templates);
    responseRepository.getResponseStats
      // t1: highly effective
      .mockResolvedValueOnce(stats({ total: 10, clicked: 9, completed: 8, avgResponseTime: 500 }))
      // t2: ineffective
      .mockResolvedValueOnce(stats({ total: 10, ignored: 10 }))
      // t3: no data → null, excluded from the report
      .mockResolvedValueOnce(stats());

    const useCase = new AnalyzeReminderFrequencyUseCase(templateRepository, responseRepository);

    const result = await useCase.executeGlobal('identity-1', 30);

    expect(templateRepository.findByIdentityId).toHaveBeenCalledWith('identity-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.identityId).toBe('identity-1');
      expect(result.data.totalTemplates).toBe(3);
      expect(result.data.highEffective).toHaveLength(1);
      expect(result.data.highEffective[0].templateId).toBe('t1');
      expect(result.data.lowEffective).toHaveLength(1);
      expect(result.data.lowEffective[0].templateId).toBe('t2');
      expect(result.data.analyzedAt).toBeTypeOf('number');
    }
  });

  it('returns empty global aggregates when there are no templates', async () => {
    templateRepository.findByIdentityId.mockResolvedValue([]);
    const useCase = new AnalyzeReminderFrequencyUseCase(templateRepository, responseRepository);

    const result = await useCase.executeGlobal('identity-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalTemplates).toBe(0);
      expect(result.data.avgClickRate).toBe(0);
      expect(result.data.avgEffectivenessScore).toBe(0);
      expect(result.data.highEffective).toEqual([]);
      expect(result.data.lowEffective).toEqual([]);
    }
  });
});

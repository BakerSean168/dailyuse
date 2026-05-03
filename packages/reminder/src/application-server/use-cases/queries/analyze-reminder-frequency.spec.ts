import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyzeReminderFrequencyUseCase } from './analyze-reminder-frequency.use-case';

describe('AnalyzeReminderFrequencyUseCase', () => {
  const templateRepository = {
    findById: vi.fn(),
    findByIdentityId: vi.fn(),
  } as any;

  const responseRepository = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns NOT_FOUND when template is not found', async () => {
    templateRepository.findById.mockResolvedValue(null);
    const useCase = new AnalyzeReminderFrequencyUseCase(templateRepository, responseRepository);

    const result = await useCase.execute('tpl-1');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('returns null for single-template analysis when there are no records', async () => {
    templateRepository.findById.mockResolvedValue({ id: 'tpl-1' });
    const useCase = new AnalyzeReminderFrequencyUseCase(templateRepository, responseRepository);

    const result = await useCase.execute('tpl-1', 7);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBeNull();
    }
  });

  it('builds global report using per-template analysis results', async () => {
    const templates = [{ id: 't1' }, { id: 't2' }, { id: 't3' }];
    templateRepository.findByIdentityId.mockResolvedValue(templates);
    const useCase = new AnalyzeReminderFrequencyUseCase(
      templateRepository,
      responseRepository,
    ) as any;

    useCase.analyzeTemplate = vi
      .fn()
      .mockResolvedValueOnce(
        useCase.calculateMetrics(
          [
            { action: 'clicked', responseTime: 10, timestamp: BigInt(1) },
            { action: 'clicked', responseTime: 20, timestamp: BigInt(2) },
            { action: 'completed', responseTime: 30, timestamp: BigInt(3) },
          ],
          templates[0],
        ),
      )
      .mockResolvedValueOnce(
        useCase.calculateMetrics(
          [
            { action: 'ignored', responseTime: null, timestamp: BigInt(4) },
            { action: 'dismissed', responseTime: 20, timestamp: BigInt(5) },
            { action: 'ignored', responseTime: null, timestamp: BigInt(6) },
          ],
          templates[1],
        ),
      )
      .mockResolvedValueOnce(null);

    const result = await (useCase as AnalyzeReminderFrequencyUseCase).executeGlobal(
      'identity-1',
      30,
    );

    expect(templateRepository.findByIdentityId).toHaveBeenCalledWith('identity-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.identityId).toBe('identity-1');
      expect(result.data.totalTemplates).toBe(3);
      expect(result.data.avgClickRate).toBeGreaterThanOrEqual(0);
      expect(result.data.avgEffectivenessScore).toBeGreaterThanOrEqual(0);
      expect(result.data.analyzedAt).toBeTypeOf('number');
      expect(
        result.data.highEffective.length + result.data.lowEffective.length,
      ).toBeGreaterThanOrEqual(1);
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

  it('calculateMetrics returns null for empty records', () => {
    const useCase = new AnalyzeReminderFrequencyUseCase(
      templateRepository,
      responseRepository,
    ) as any;
    expect(useCase.calculateMetrics([], {})).toBeNull();
  });

  it('calculateMetrics computes expected values for mixed responses', () => {
    const useCase = new AnalyzeReminderFrequencyUseCase(
      templateRepository,
      responseRepository,
    ) as any;

    const metrics = useCase.calculateMetrics(
      [
        { action: 'clicked', responseTime: 10, timestamp: BigInt(1) },
        { action: 'ignored', responseTime: null, timestamp: BigInt(2) },
        { action: 'snoozed', responseTime: 20, timestamp: BigInt(3) },
        { action: 'dismissed', responseTime: 15, timestamp: BigInt(4) },
        { action: 'completed', responseTime: 30, timestamp: BigInt(5) },
      ],
      {},
    );

    expect(metrics).not.toBeNull();
    expect(metrics.sampleSize).toBe(5);
    expect(metrics.clickRate).toBeCloseTo(0.2);
    expect(metrics.ignoreRate).toBeCloseTo(0.2);
    expect(metrics.snoozeCount).toBe(1);
    expect(metrics.avgResponseTime).toBeGreaterThan(0);
  });

  it('generateEffectivenessReport recommends decrease for high effectiveness', () => {
    const useCase = new AnalyzeReminderFrequencyUseCase(
      templateRepository,
      responseRepository,
    ) as any;
    const metrics = useCase.calculateMetrics(
      [
        { action: 'clicked', responseTime: 10, timestamp: BigInt(1) },
        { action: 'clicked', responseTime: 8, timestamp: BigInt(2) },
        { action: 'completed', responseTime: 9, timestamp: BigInt(3) },
      ],
      {},
    );

    const report = useCase.generateEffectivenessReport('tpl-1', metrics);
    expect(report.recommendation).toBe('decrease');
  });

  it('generateEffectivenessReport recommends increase for low effectiveness', () => {
    const useCase = new AnalyzeReminderFrequencyUseCase(
      templateRepository,
      responseRepository,
    ) as any;
    const metrics = {
      clickRate: 0,
      ignoreRate: 1,
      avgResponseTime: 0,
      effectivenessScore: 0.1,
      sampleSize: 3,
    };

    const report = useCase.generateEffectivenessReport('tpl-2', metrics);
    expect(report.recommendation).toBe('increase');
  });

  it('generateEffectivenessReport recommends no_change for middle effectiveness', () => {
    const useCase = new AnalyzeReminderFrequencyUseCase(
      templateRepository,
      responseRepository,
    ) as any;
    const metrics = {
      clickRate: 0.4,
      ignoreRate: 0.3,
      avgResponseTime: 12,
      effectivenessScore: 0.5,
      sampleSize: 20,
    };

    const report = useCase.generateEffectivenessReport('tpl-3', metrics);
    expect(report.recommendation).toBe('no_change');
  });
});

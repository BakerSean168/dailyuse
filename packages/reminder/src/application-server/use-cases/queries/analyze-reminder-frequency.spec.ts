import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyzeReminderFrequency } from './analyze-reminder-frequency';

describe('AnalyzeReminderFrequency', () => {
  const templateRepository = {
    findById: vi.fn(),
    findByIdentityId: vi.fn(),
  } as any;

  const responseRepository = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when template is not found', async () => {
    templateRepository.findById.mockResolvedValue(null);
    const service = new AnalyzeReminderFrequency(templateRepository, responseRepository);

    await expect(service.execute('tpl-1')).rejects.toThrow('Template tpl-1 not found');
  });

  it('returns null for single-template analysis when there are no records', async () => {
    templateRepository.findById.mockResolvedValue({ id: 'tpl-1' });
    const service = new AnalyzeReminderFrequency(templateRepository, responseRepository);

    const result = await service.execute('tpl-1', 7);

    expect(result).toBeNull();
  });

  it('builds global report using per-template analysis results', async () => {
    const templates = [{ id: 't1' }, { id: 't2' }, { id: 't3' }];
    templateRepository.findByIdentityId.mockResolvedValue(templates);
    const service = new AnalyzeReminderFrequency(templateRepository, responseRepository) as any;

    service.analyzeTemplate = vi
      .fn()
      .mockResolvedValueOnce(
        service.calculateMetrics(
          [
            { action: 'clicked', responseTime: 10, timestamp: BigInt(1) },
            { action: 'clicked', responseTime: 20, timestamp: BigInt(2) },
            { action: 'completed', responseTime: 30, timestamp: BigInt(3) },
          ],
          templates[0],
        ),
      )
      .mockResolvedValueOnce(
        service.calculateMetrics(
          [
            { action: 'ignored', responseTime: null, timestamp: BigInt(4) },
            { action: 'dismissed', responseTime: 20, timestamp: BigInt(5) },
            { action: 'ignored', responseTime: null, timestamp: BigInt(6) },
          ],
          templates[1],
        ),
      )
      .mockResolvedValueOnce(null);

    const report = await service.executeGlobal('identity-1', 30);

    expect(templateRepository.findByIdentityId).toHaveBeenCalledWith('identity-1');
    expect(report.identityId).toBe('identity-1');
    expect(report.totalTemplates).toBe(3);
    expect(report.avgClickRate).toBeGreaterThanOrEqual(0);
    expect(report.avgEffectivenessScore).toBeGreaterThanOrEqual(0);
    expect(report.analyzedAt).toBeTypeOf('number');
    expect(report.highEffective.length + report.lowEffective.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty global aggregates when there are no templates', async () => {
    templateRepository.findByIdentityId.mockResolvedValue([]);
    const service = new AnalyzeReminderFrequency(templateRepository, responseRepository);

    const report = await service.executeGlobal('identity-1');

    expect(report.totalTemplates).toBe(0);
    expect(report.avgClickRate).toBe(0);
    expect(report.avgEffectivenessScore).toBe(0);
    expect(report.highEffective).toEqual([]);
    expect(report.lowEffective).toEqual([]);
  });

  it('calculateMetrics returns null for empty records', () => {
    const service = new AnalyzeReminderFrequency(templateRepository, responseRepository) as any;
    expect(service.calculateMetrics([], {})).toBeNull();
  });

  it('calculateMetrics computes expected values for mixed responses', () => {
    const service = new AnalyzeReminderFrequency(templateRepository, responseRepository) as any;

    const metrics = service.calculateMetrics(
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
    const service = new AnalyzeReminderFrequency(templateRepository, responseRepository) as any;
    const metrics = service.calculateMetrics(
      [
        { action: 'clicked', responseTime: 10, timestamp: BigInt(1) },
        { action: 'clicked', responseTime: 8, timestamp: BigInt(2) },
        { action: 'completed', responseTime: 9, timestamp: BigInt(3) },
      ],
      {},
    );

    const report = service.generateEffectivenessReport('tpl-1', metrics);
    expect(report.recommendation).toBe('decrease');
  });

  it('generateEffectivenessReport recommends increase for low effectiveness', () => {
    const service = new AnalyzeReminderFrequency(templateRepository, responseRepository) as any;
    const metrics = {
      clickRate: 0,
      ignoreRate: 1,
      avgResponseTime: 0,
      effectivenessScore: 0.1,
      sampleSize: 3,
    };

    const report = service.generateEffectivenessReport('tpl-2', metrics);
    expect(report.recommendation).toBe('increase');
  });

  it('generateEffectivenessReport recommends no_change for middle effectiveness', () => {
    const service = new AnalyzeReminderFrequency(templateRepository, responseRepository) as any;
    const metrics = {
      clickRate: 0.4,
      ignoreRate: 0.3,
      avgResponseTime: 12,
      effectivenessScore: 0.5,
      sampleSize: 20,
    };

    const report = service.generateEffectivenessReport('tpl-3', metrics);
    expect(report.recommendation).toBe('no_change');
  });
});

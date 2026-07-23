import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 857: FrequencyAdjustmentDTO / ResponseMetricsDTO duals retired.
 * Sole VO interface + `export type XDTO = X` for each exact-match pair.
 */
describe('reminder metrics vo dto duals retired (residual 857)', () => {
  const voDir = __dirname;
  const frequency = readFileSync(resolve(voDir, 'frequency-adjustment.ts'), 'utf8');
  const metrics = readFileSync(resolve(voDir, 'response-metrics.ts'), 'utf8');
  const index = readFileSync(resolve(voDir, 'index.ts'), 'utf8');

  it('owns FrequencyAdjustmentDTO as type alias of FrequencyAdjustment', () => {
    expect(frequency).toContain('Residual 857');
    expect(frequency).toMatch(/export interface FrequencyAdjustment\b/);
    expect(frequency).toContain('export type FrequencyAdjustmentDTO = FrequencyAdjustment');
    expect(frequency).not.toMatch(/export interface FrequencyAdjustmentDTO\b/);
  });

  it('owns ResponseMetricsDTO as type alias of ResponseMetrics', () => {
    expect(metrics).toContain('Residual 857');
    expect(metrics).toMatch(/export interface ResponseMetrics\b/);
    expect(metrics).toContain('export type ResponseMetricsDTO = ResponseMetrics');
    expect(metrics).not.toMatch(/export interface ResponseMetricsDTO\b/);
  });

  it('barrel still exports FrequencyAdjustment/ResponseMetrics and DTO names', () => {
    for (const name of [
      'FrequencyAdjustment',
      'FrequencyAdjustmentDTO',
      'ResponseMetrics',
      'ResponseMetricsDTO',
    ]) {
      expect(index).toContain(name);
    }
    expect(index).toContain("from './frequency-adjustment'");
    expect(index).toContain("from './response-metrics'");
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 653: retire zero-consumer schedule factory Static duals and
 * ScheduleDashboardDTO dead dual. Domain classes own factories; live lists use
 * CalendarEntry/ScheduleTask/ScheduleExecution Client DTOs.
 */
describe('schedule server static/dashboard dual single-track surface (residual 653)', () => {
  const aggregates = __dirname;
  const entities = resolve(aggregates, '../entities');
  const dtos = resolve(aggregates, '../dtos');

  it('retires ScheduleTaskServerStatic factory dual', () => {
    const server = readFileSync(resolve(aggregates, 'schedule-task-server.ts'), 'utf8');
    expect(server).not.toMatch(/export interface ScheduleTaskServerStatic\b/);
    expect(server).toContain('export interface ScheduleTaskServerDTO');
  });

  it('retires ScheduleExecutionServerStatic factory dual', () => {
    const server = readFileSync(resolve(entities, 'schedule-execution-server.ts'), 'utf8');
    expect(server).not.toMatch(/export interface ScheduleExecutionServerStatic\b/);
    expect(server).toContain('export interface ScheduleExecutionServerDTO');
  });

  it('retires ScheduleDashboardDTO dead dual barrel surface', () => {
    const index = readFileSync(resolve(dtos, 'index.ts'), 'utf8');
    expect(index).not.toMatch(/export interface ScheduleDashboardDTO\b/);
    expect(index).toMatch(/Residual 653/);
  });
});

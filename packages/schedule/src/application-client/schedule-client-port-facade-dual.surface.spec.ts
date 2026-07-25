import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 298: ScheduleClientPort is an intentional multi-API mapping facade dual.
 * Domain-facing task aggregates + DTO→domain mappers over event/task API clients.
 * Do not collapse to a single I*ApiClient type alias.
 */
describe('schedule client port intentional facade dual surface', () => {
  const service = readFileSync(resolve(__dirname, 'schedule-client-service.ts'), 'utf8');
  const port = readFileSync(resolve(__dirname, 'schedule-client.port.ts'), 'utf8');
  const eventApi = readFileSync(
    resolve(__dirname, 'ports/schedule-event-api-client.port.ts'),
    'utf8',
  );
  const taskApi = readFileSync(
    resolve(__dirname, 'ports/schedule-task-api-client.port.ts'),
    'utf8',
  );

  it('splits transport surface across event/task API client ports', () => {
    expect(eventApi).toContain('export interface IScheduleEventApiClient');
    expect(taskApi).toContain('export interface IScheduleTaskApiClient');
    expect(eventApi).toContain('createSchedule');
    expect(taskApi).toContain('createTask');
  });

  it('ScheduleClientPort remains domain facade with mappers over two APIs', () => {
    expect(port).toMatch(/export interface ScheduleClientPort\s*\{/);
    expect(port).not.toMatch(/export type ScheduleClientPort\s*=\s*IScheduleEventApiClient/);
    expect(service).toContain('implements ScheduleClientPort');
    expect(service).toContain('private readonly eventApi: IScheduleEventApiClient');
    expect(service).toContain('private readonly taskApi: IScheduleTaskApiClient');
    expect(service).toContain('function scheduleTaskFromDTO');
    expect(service).toContain('function scheduleExecutionFromDTO');
    expect(port).toContain('ScheduleTask');
    expect(service).toContain('this.eventApi.');
    expect(service).toContain('this.taskApi.');
  });
});

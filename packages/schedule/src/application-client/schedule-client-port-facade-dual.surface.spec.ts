import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Product Schedule capability is narrower than the temporary HTTP/Mobile compatibility port. */
describe('schedule client capability split surface', () => {
  const service = readFileSync(resolve(__dirname, 'schedule-client-service.ts'), 'utf8');
  const port = readFileSync(resolve(__dirname, 'schedule-client.port.ts'), 'utf8');
  const client = readFileSync(resolve(__dirname, '../client/index.ts'), 'utf8');
  const taskApi = readFileSync(
    resolve(__dirname, 'ports/schedule-task-api-client.port.ts'),
    'utf8',
  );

  it('separates read-only worker queries from the full Mobile HTTP compatibility API', () => {
    expect(taskApi).toContain('export interface IScheduleTaskQueryApiClient');
    expect(taskApi).toContain(
      'export interface IScheduleTaskApiClient extends IScheduleTaskQueryApiClient',
    );
    expect(port).toContain('export interface ScheduleProductClientPort');
    expect(port).toContain('export interface ScheduleClientPort extends ScheduleProductClientPort');
    expect(service).toContain('implements ScheduleProductClientPort');
    expect(service).toContain('implements ScheduleClientPort');
    expect(service).toContain('protected readonly taskQueryApi: IScheduleTaskQueryApiClient');
    expect(service).toContain('private readonly taskApi: IScheduleTaskApiClient');
  });

  it('binds IPC to the product port while HTTP keeps the full compatibility port', () => {
    expect(client).toMatch(/createScheduleIpcClient\([^)]*\): ScheduleProductClientPort/);
    expect(client).toMatch(/createScheduleHttpClient\([^)]*\): ScheduleClientPort/);
    expect(client).toContain('createScheduleProductClientService(adapters.event, adapters.task)');
    expect(client).toContain('createScheduleServiceFromHttpClient(httpClient)');
  });
});

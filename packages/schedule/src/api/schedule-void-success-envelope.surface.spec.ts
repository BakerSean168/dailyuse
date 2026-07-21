import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Schedule void-success envelope surface (stage-6 residual 93):
 * task/event deletes use z.null()/ok(null).
 */
describe('schedule void success envelope surface', () => {
  const taskRoutes = readFileSync(resolve(__dirname, './routes.ts'), 'utf8');
  const eventRoutes = readFileSync(resolve(__dirname, './schedule-event.routes.ts'), 'utf8');
  const taskController = readFileSync(
    resolve(__dirname, '../server/transport/schedule.controller.ts'),
    'utf8',
  );
  const eventController = readFileSync(
    resolve(__dirname, '../server/transport/schedule-event.controller.ts'),
    'utf8',
  );
  const electron = readFileSync(resolve(__dirname, '../electron/index.ts'), 'utf8');

  it('OpenAPI void deletes use z.null()', () => {
    expect(taskRoutes).toContain("successResponse(z.null(), '删除成功')");
    expect(eventRoutes).toContain("successResponse(z.null(), '删除成功')");
  });

  it('controllers return ok(null) for deletes', () => {
    expect(taskController).toMatch(/async deleteTask[\s\S]*?Promise<Result<null>>/);
    expect(eventController).toMatch(/async delete[\s\S]*?Promise<Result<null>>/);
    expect(taskController).toContain('return ok(null)');
    expect(eventController).toContain('return ok(null)');
  });

  it('Desktop IPC void delete handlers normalize to ok(null)', () => {
    expect(electron).toContain('ScheduleChannels.DELETE');
    expect(electron).toContain('ScheduleChannels.TASK_DELETE');
    expect((electron.match(/return ok\(null\)/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

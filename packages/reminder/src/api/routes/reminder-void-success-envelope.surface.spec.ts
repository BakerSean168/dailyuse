import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Reminder void-success envelope surface (stage-6 residual 91):
 * void deletes / reject use z.null()/ok(null);
 * FrequencyAdjustmentResult no longer carries redundant success boolean.
 */
describe('reminder void success envelope surface', () => {
  const templateRoutes = readFileSync(resolve(__dirname, './reminder-template.routes.ts'), 'utf8');
  const groupRoutes = readFileSync(resolve(__dirname, './reminder-group.routes.ts'), 'utf8');
  const controller = readFileSync(
    resolve(__dirname, '../../server/transport/reminder.controller.ts'),
    'utf8',
  );
  const electron = readFileSync(resolve(__dirname, '../../electron/index.ts'), 'utf8');
  const responseSchemas = readFileSync(
    resolve(__dirname, '../../../../contracts/src/modules/reminder/api/response-schemas.ts'),
    'utf8',
  );
  const adjustUseCase = readFileSync(
    resolve(
      __dirname,
      '../../server/application/use-cases/commands/adjust-reminder-frequency.use-case.ts',
    ),
    'utf8',
  );

  it('OpenAPI void deletes/reject use z.null()', () => {
    expect(templateRoutes).toContain("successResponse(z.null(), '删除成功')");
    expect(groupRoutes).toContain("successResponse(z.null(), '删除成功')");
    expect(templateRoutes).toContain("successResponse(z.null(), '已拒绝')");
  });

  it('FrequencyAdjustmentResultSchema has no success boolean dual-track', () => {
    const blockMatch = responseSchemas.match(
      /export const FrequencyAdjustmentResultSchema = z\.object\(\{[\s\S]*?\}\);/,
    );
    expect(blockMatch).toBeTruthy();
    expect(blockMatch![0]).not.toContain('success: z.boolean()');
    expect(adjustUseCase).not.toContain('success: true');
    expect(adjustUseCase).not.toContain('success: boolean');
  });

  it('controllers return ok(null) for void deletes/reject', () => {
    expect(controller).toMatch(/async deleteTemplate[\s\S]*?Promise<Result<null>>/);
    expect(controller).toMatch(/async deleteGroup[\s\S]*?Promise<Result<null>>/);
    expect(controller).toMatch(/async rejectFrequencyAdjustment[\s\S]*?Promise<Result<null>>/);
    expect((controller.match(/return ok\(null\)/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it('Desktop IPC void delete handlers normalize to ok(null)', () => {
    expect(electron).toContain('ReminderChannels.TEMPLATE_DELETE');
    expect(electron).toContain('ReminderChannels.GROUP_DELETE');
    expect((electron.match(/return ok\(null\)/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

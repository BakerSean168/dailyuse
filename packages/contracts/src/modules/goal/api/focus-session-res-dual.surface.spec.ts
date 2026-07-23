import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 777: GetFocusStatisticsRes / GetPomodoroConfigRes dual bodies retired.
 * Res types are z.infer aliases of sole *ResSchema shapes.
 */
describe('focus session res duals retired (residual 777)', () => {
  const dto = readFileSync(resolve(__dirname, 'focus-session.dto.ts'), 'utf8');

  it('owns GetFocusStatisticsResSchema and z.infer alias', () => {
    expect(dto).toContain('Residual 777');
    expect(dto).toContain(
      'export const GetFocusStatisticsResSchema = z.object({',
    );
    expect(dto).toContain(
      'export type GetFocusStatisticsRes = z.infer<typeof GetFocusStatisticsResSchema>',
    );
    expect(dto).not.toMatch(/export interface GetFocusStatisticsRes\b/);
  });

  it('owns GetPomodoroConfigResSchema and z.infer alias', () => {
    expect(dto).toContain(
      'export const GetPomodoroConfigResSchema = z.object({',
    );
    expect(dto).toContain(
      'export type GetPomodoroConfigRes = z.infer<typeof GetPomodoroConfigResSchema>',
    );
    expect(dto).not.toMatch(/export interface GetPomodoroConfigRes\b/);
  });

  it('schemas cover statistics and pomodoro field sets', () => {
    expect(dto).toContain('todayDurationMinutes: z.number()');
    expect(dto).toContain('focusDurationMinutes: z.number()');
    expect(dto).toContain('autoStartBreaks: z.boolean()');
  });
});

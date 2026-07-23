import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 813: FocusSessionClientDTO dual body retired.
 * Sole FocusSessionClientDTOSchema + z.infer (optional UI remaining/progress/isActive fields).
 */
describe('focus session client dto dual retired (residual 813)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const aggregate = readFileSync(
    resolve(apiDir, '../aggregates/focus-session-client.ts'),
    'utf8',
  );
  const dto = readFileSync(resolve(apiDir, 'focus-session.dto.ts'), 'utf8');

  it('owns FocusSessionClientDTO as z.infer of FocusSessionClientDTOSchema', () => {
    expect(aggregate).toContain('Residual 813');
    expect(aggregate).toContain("from '../api/response-schemas'");
    expect(aggregate).toContain(
      'export type FocusSessionClientDTO = z.infer<typeof FocusSessionClientDTOSchema>',
    );
    expect(aggregate).not.toMatch(/export interface FocusSessionClientDTO\b/);
  });

  it('FocusSessionClientDTOSchema owns transport + optional UI fields', () => {
    expect(responseSchemas).toContain('Residual 813');
    expect(responseSchemas).toContain(
      'export const FocusSessionClientDTOSchema = z.object({',
    );
    expect(responseSchemas).toContain('durationMinutes: z.number()');
    expect(responseSchemas).toContain('actualDurationMinutes: z.number()');
    expect(responseSchemas).toContain('remainingMinutes: z.number().optional()');
    expect(responseSchemas).toContain('progressPercentage: z.number().optional()');
    expect(responseSchemas).toContain('isActive: z.boolean().optional()');
  });

  it('focus status/history Res nest FocusSessionClientDTOSchema', () => {
    expect(dto).toContain('session: FocusSessionClientDTOSchema.nullable()');
    expect(dto).toContain('data: z.array(FocusSessionClientDTOSchema)');
    expect(dto).toContain("from './response-schemas'");
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 791: ExportGoalsRes / ImportGoalsRes dual bodies retired.
 * Sole *ResSchema + z.infer (export data string|Uint8Array union).
 */
describe('export/import goals res duals retired (residual 791)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'goal-crud.dto.ts'), 'utf8');

  it('owns export/import ResSchema and z.infer aliases', () => {
    expect(dto).toContain('Residual 791');
    expect(dto).toContain('export const ExportGoalsResSchema = z.object({');
    expect(dto).toContain(
      'export type ExportGoalsRes = z.infer<typeof ExportGoalsResSchema>',
    );
    expect(dto).toContain('export const ImportGoalsResSchema = z.object({');
    expect(dto).toContain(
      'export type ImportGoalsRes = z.infer<typeof ImportGoalsResSchema>',
    );
    expect(dto).not.toMatch(/export interface ExportGoalsRes\b/);
    expect(dto).not.toMatch(/export interface ImportGoalsRes\b/);
  });

  it('export data is string|Uint8Array union; import errors optional array', () => {
    expect(dto).toContain('z.custom<Uint8Array>((val) => val instanceof Uint8Array)');
    expect(dto).toContain('filename: z.string()');
    expect(dto).toContain('mimeType: z.string()');
    expect(dto).toContain('importedCount: z.number()');
    expect(dto).toContain('skippedCount: z.number()');
    expect(dto).toContain('line: z.number()');
    expect(dto).toContain('error: z.string()');
  });
});

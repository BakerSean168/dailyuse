import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 737: goal key-result progress/snapshot dual bodies retired.
 * KeyResultProgressDTO / KeyResultSnapshotDTO reuse *DTOSchema only.
 */
describe('goal key-result progress/snapshot dual retired (residual 737)', () => {
  const apiDir = __dirname;
  const progress = readFileSync(
    resolve(apiDir, '../value-objects/key-result-progress.ts'),
    'utf8',
  );
  const snapshot = readFileSync(
    resolve(apiDir, '../value-objects/key-result-snapshot.ts'),
    'utf8',
  );
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('exports progress/snapshot schemas as sole shapes from VO modules', () => {
    expect(progress).toContain('Residual 737');
    expect(progress).toContain(
      'export const KeyResultProgressDTOSchema = z.object({',
    );
    expect(snapshot).toContain('Residual 737');
    expect(snapshot).toContain(
      'export const KeyResultSnapshotDTOSchema = z.object({',
    );
  });

  it('semantic DTOs are z.infer aliases without interface dual bodies', () => {
    expect(progress).toContain(
      'export type KeyResultProgressDTO = z.infer<typeof KeyResultProgressDTOSchema>',
    );
    expect(progress).not.toMatch(/export interface KeyResultProgressDTO\b/);
    expect(snapshot).toContain(
      'export type KeyResultSnapshotDTO = z.infer<typeof KeyResultSnapshotDTOSchema>',
    );
    expect(snapshot).not.toMatch(/export interface KeyResultSnapshotDTO\b/);
  });

  it('response-schemas re-exports VO-owned schemas (no local dual bodies)', () => {
    expect(responseSchemas).toContain('Residual 737');
    expect(responseSchemas).toContain("from '../value-objects/key-result-progress'");
    expect(responseSchemas).toContain("from '../value-objects/key-result-snapshot'");
    expect(responseSchemas).toContain(
      'export { KeyResultProgressDTOSchema, KeyResultSnapshotDTOSchema }',
    );
    expect(responseSchemas).not.toMatch(
      /const KeyResultProgressDTOSchema = z\.object\(\{/,
    );
    expect(responseSchemas).not.toMatch(
      /const KeyResultSnapshotDTOSchema = z\.object\(\{/,
    );
    expect(responseSchemas).toContain('progress: KeyResultProgressDTOSchema');
    expect(responseSchemas).toContain(
      'keyResultSnapshots: z.array(KeyResultSnapshotDTOSchema)',
    );
  });
});

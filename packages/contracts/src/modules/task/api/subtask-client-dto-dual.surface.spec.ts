import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 841: SubtaskClientDTO dual body retired.
 * Sole SubtaskResponseSchema + z.infer. SubtaskServerDTO remains retired (residual 649).
 */
describe('subtask client dto dual retired (residual 841)', () => {
  const apiDir = __dirname;
  const client = readFileSync(resolve(apiDir, '../entities/subtask-client.ts'), 'utf8');
  const schemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const entities = resolve(apiDir, '../entities');

  it('owns SubtaskClientDTO as z.infer of SubtaskResponseSchema', () => {
    expect(client).toContain('Residual 841');
    expect(client).toContain(
      'export type SubtaskClientDTO = z.infer<typeof SubtaskResponseSchema>',
    );
    expect(client).not.toMatch(/export interface SubtaskClientDTO\b/);
    expect(schemas).toContain('Residual 841');
    expect(schemas).toContain('export const SubtaskResponseSchema = z.object({');
    expect(schemas).toContain('isCompleted: z.boolean()');
  });

  it('keeps SubtaskServerDTO retired (client-only track)', () => {
    expect(existsSync(resolve(entities, 'subtask-server.ts'))).toBe(false);
    const entitiesIndex = readFileSync(resolve(entities, 'index.ts'), 'utf8');
    expect(entitiesIndex).not.toMatch(/SubtaskServerDTO/);
    expect(entitiesIndex).toContain('SubtaskClientDTO');
  });

  it('client imports response-schemas only (no manual field dual)', () => {
    expect(client).toContain("from '../api/response-schemas'");
    expect(client).not.toContain('TransferDate');
    expect(client).not.toContain('createdAt: TransferDate');
  });
});

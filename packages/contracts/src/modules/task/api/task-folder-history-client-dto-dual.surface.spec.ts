import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 837: TaskFolderClientDTO / TaskTemplateHistoryClientDTO dual bodies retired.
 * Sole *ResponseSchema + z.infer. Server DTOs remain separate interfaces (identical shape).
 * Soft residual 841: SubtaskClientDTO dual also retired via SubtaskResponseSchema.
 */
describe('task folder/history client dto duals retired (residual 837)', () => {
  const apiDir = __dirname;
  const folder = readFileSync(
    resolve(apiDir, '../aggregates/task-folder-client.ts'),
    'utf8',
  );
  const history = readFileSync(
    resolve(apiDir, '../entities/task-template-history-client.ts'),
    'utf8',
  );
  const schemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const folderServer = readFileSync(
    resolve(apiDir, '../aggregates/task-folder-server.ts'),
    'utf8',
  );
  const historyServer = readFileSync(
    resolve(apiDir, '../entities/task-template-history-server.ts'),
    'utf8',
  );

  it('owns TaskFolderClientDTO as z.infer of TaskFolderResponseSchema', () => {
    expect(folder).toContain('Residual 837');
    expect(folder).toContain(
      'export type TaskFolderClientDTO = z.infer<typeof TaskFolderResponseSchema>',
    );
    expect(folder).not.toMatch(/export interface TaskFolderClientDTO\b/);
    expect(schemas).toContain('Residual 837');
    expect(schemas).toContain('export const TaskFolderResponseSchema = z.object({');
    expect(schemas).toContain('icon: z.string().nullable()');
    expect(folderServer).toMatch(/export interface TaskFolderServerDTO\b/);
  });

  it('owns TaskTemplateHistoryClientDTO as z.infer of TaskTemplateHistoryResponseSchema', () => {
    expect(history).toContain('Residual 837');
    expect(history).toContain(
      'export type TaskTemplateHistoryClientDTO = z.infer<typeof TaskTemplateHistoryResponseSchema>',
    );
    expect(history).not.toMatch(/export interface TaskTemplateHistoryClientDTO\b/);
    expect(schemas).toContain(
      'export const TaskTemplateHistoryResponseSchema = z.object({',
    );
    expect(schemas).toContain('changes: z.unknown()');
    expect(historyServer).toMatch(/export interface TaskTemplateHistoryServerDTO\b/);
  });

  it('keeps server DTO files as sole interface bodies (no client interface dual)', () => {
    expect(folderServer).not.toMatch(/export interface TaskFolderClientDTO\b/);
    expect(historyServer).not.toMatch(/export interface TaskTemplateHistoryClientDTO\b/);
    expect(folder).toContain("from '../api/response-schemas'");
    expect(history).toContain("from '../api/response-schemas'");
  });
});

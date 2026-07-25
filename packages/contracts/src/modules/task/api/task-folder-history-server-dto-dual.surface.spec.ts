import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 843: TaskFolderServerDTO / TaskTemplateHistoryServerDTO dual bodies retired.
 * Same *ResponseSchema + z.infer as Client (residual 837). Full client+server single-track.
 */
describe('task folder/history server dto duals retired (residual 843)', () => {
  const apiDir = __dirname;
  const folderServer = readFileSync(
    resolve(apiDir, '../aggregates/task-folder-server.ts'),
    'utf8',
  );
  const historyServer = readFileSync(
    resolve(apiDir, '../entities/task-template-history-server.ts'),
    'utf8',
  );
  const folderClient = readFileSync(
    resolve(apiDir, '../aggregates/task-folder-client.ts'),
    'utf8',
  );
  const historyClient = readFileSync(
    resolve(apiDir, '../entities/task-template-history-client.ts'),
    'utf8',
  );
  const schemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('owns TaskFolderServerDTO as z.infer of TaskFolderResponseSchema', () => {
    expect(folderServer).toContain('Residual 843');
    expect(folderServer).toContain(
      'export type TaskFolderServerDTO = z.infer<typeof TaskFolderResponseSchema>',
    );
    expect(folderServer).not.toMatch(/export interface TaskFolderServerDTO\b/);
    expect(schemas).toContain('Residual 843');
    expect(schemas).toContain('export const TaskFolderResponseSchema = z.object({');
    expect(folderClient).toContain(
      'export type TaskFolderClientDTO = z.infer<typeof TaskFolderResponseSchema>',
    );
  });

  it('owns TaskTemplateHistoryServerDTO as z.infer of TaskTemplateHistoryResponseSchema', () => {
    expect(historyServer).toContain('Residual 843');
    expect(historyServer).toContain(
      'export type TaskTemplateHistoryServerDTO = z.infer<typeof TaskTemplateHistoryResponseSchema>',
    );
    expect(historyServer).not.toMatch(/export interface TaskTemplateHistoryServerDTO\b/);
    expect(schemas).toContain(
      'export const TaskTemplateHistoryResponseSchema = z.object({',
    );
    expect(historyClient).toContain(
      'export type TaskTemplateHistoryClientDTO = z.infer<typeof TaskTemplateHistoryResponseSchema>',
    );
  });

  it('server files import response-schemas only (no manual field dual)', () => {
    expect(folderServer).toContain("from '../api/response-schemas'");
    expect(historyServer).toContain("from '../api/response-schemas'");
    expect(folderServer).not.toContain('TransferDate');
    expect(historyServer).not.toContain('changes: unknown');
  });
});

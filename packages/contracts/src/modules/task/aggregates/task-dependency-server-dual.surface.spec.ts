import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 649: retire zero-consumer task dependency/subtask Server duals.
 * Live path keeps TaskDependencyServerDTO + DependencyChainClientDTO + SubtaskClientDTO.
  *
 * Soft residual 831: TaskDependencyClientDTO dual retired via TaskDependencyResponseSchema; DependencyChain stays interface
 * (see task-instance-dependency-schedule-task-client-dto-dual surface).
 * Soft residual 837: TaskFolderClientDTO / TaskTemplateHistoryClientDTO duals retired via *ResponseSchema.
 * Soft residual 841: SubtaskClientDTO dual retired via SubtaskResponseSchema (see subtask-client-dto-dual surface).
 */
describe('task dependency/subtask server dual single-track surface (residual 649)', () => {
  const aggregates = __dirname;
  const entities = resolve(aggregates, '../entities');

  it('retires TaskTemplateWithDependencies / DependencyChain Server duals', () => {
    const server = readFileSync(resolve(aggregates, 'task-dependency-server.ts'), 'utf8');
    const client = readFileSync(resolve(aggregates, 'task-dependency-client.ts'), 'utf8');
    const index = readFileSync(resolve(aggregates, 'index.ts'), 'utf8');

    expect(server).not.toMatch(/export interface TaskTemplateWithDependenciesServerDTO\b/);
    expect(server).not.toMatch(/export interface DependencyChainServerDTO\b/);
    expect(client).not.toMatch(/export interface TaskTemplateWithDependenciesClientDTO\b/);
    expect(server).toContain('export interface TaskDependencyServerDTO');
    expect(server).toContain('export interface CircularDependencyValidationResult');
    expect(client).toContain('export interface DependencyChainClientDTO');
    expect(index).not.toMatch(/TaskTemplateWithDependencies/);
    expect(index).not.toMatch(/DependencyChainServerDTO/);
    expect(index).toContain('DependencyChainClientDTO');
  });

  it('retires SubtaskServerDTO dual; keeps SubtaskClientDTO', () => {
    const entitiesIndex = readFileSync(resolve(entities, 'index.ts'), 'utf8');
    const client = readFileSync(resolve(entities, 'subtask-client.ts'), 'utf8');
    expect(existsSync(resolve(entities, 'subtask-server.ts'))).toBe(false);
    expect(entitiesIndex).not.toMatch(/SubtaskServerDTO/);
    expect(entitiesIndex).not.toMatch(/subtask-server/);
    expect(entitiesIndex).toContain('SubtaskClientDTO');
    // Soft residual 841: ClientDTO is z.infer alias (no interface dual body).
    expect(client).toContain(
      'export type SubtaskClientDTO = z.infer<typeof SubtaskResponseSchema>',
    );
    expect(client).not.toMatch(/export interface SubtaskClientDTO\b/);
  });
});

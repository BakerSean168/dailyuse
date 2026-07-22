import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Task dependency ownership surface (stage-6 residual 125):
 * list/get/update/delete/validate dependency paths must never authorize by
 * bare dependency/task id alone.
 */
describe('task dependency ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-task-dependency-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../task-dependency-prisma.repository.ts'),
    'utf8',
  );
  const powersync = readFileSync(
    resolve(__dirname, '../../powersync/task-dependency-powersync.repository.ts'),
    'utf8',
  );
  const deleteUseCase = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/delete-task-dependency.use-case.ts',
    ),
    'utf8',
  );
  const routes = readFileSync(
    resolve(__dirname, '../../../../../api/routes/task-dependency.routes.ts'),
    'utf8',
  );
  const electron = readFileSync(resolve(__dirname, '../../../../../electron/index.ts'), 'utf8');
  const module = readFileSync(resolve(__dirname, '../../../task.module.ts'), 'utf8');

  it('port ownership methods require identityId', () => {
    expect(port).toContain(
      'findByIdForIdentity(identityId: string, id: string): Promise<TaskDependencyServerDTO | null>;',
    );
    expect(port).toContain(
      'findAggregateByIdForIdentity(identityId: string, id: string): Promise<TaskDependency | null>;',
    );
    expect(port).toContain('delete(identityId: string, id: string): Promise<void>;');
    expect(port).toContain('findBySuccessorId(taskId: string, identityId: string)');
  });

  it('prisma filters by identityId on owned reads and deletes', () => {
    expect(prisma).toContain('where: { id, identityId }');
    expect(prisma).toContain('deleteMany({');
    expect(prisma).toContain(
      "throw new Error('Task dependency not found for the current identity.');",
    );
  });

  it('delete use case loads via findAggregateByIdForIdentity', () => {
    expect(deleteUseCase).toContain('findAggregateByIdForIdentity(');
    expect(deleteUseCase).toMatch(/execute\(id: string, identityId: string\)/);
  });

  it('module api wrappers pass identityId for dependency mutations and lists', () => {
    expect(module).toMatch(/deleteTaskDependency:\s*\(id, identityId\)\s*=>/);
    expect(module).toMatch(/updateTaskDependency:\s*\(id, identityId, input\)\s*=>/);
    expect(module).toMatch(/listTaskDependencies:\s*\(taskId, identityId\)\s*=>/);
    expect(module).toMatch(
      /validateTaskDependency:\s*\(predecessorTaskId, successorTaskId, identityId\)\s*=>/,
    );
  });

  it('HTTP and Electron dependency paths pass identity context', () => {
    expect(routes).toContain('controller.getDependencies(req.params!.taskId, ctx.identityId)');
    expect(routes).toContain('controller.deleteDependency(req.params!.id, ctx.identityId)');
    expect(routes).toContain(
      'controller.updateDependency(req.params!.id, req.body, ctx.identityId)',
    );
    expect(electron).toMatch(
      /DEPENDENCY_DELETE[\s\S]*dependencyController\.deleteDependency\([\s\S]*requestContext\.identityId/,
    );
    expect(electron).toMatch(
      /DEPENDENCY_LIST[\s\S]*getDependencies\(payload\?\.taskId, requestContext\.identityId\)/,
    );
  });

  it('port deleteByTaskId requires identityId (residual 153)', () => {
    expect(port).toContain(
      'deleteByTaskId(identityId: string, taskId: string): Promise<void>;',
    );
  });

  it('prisma deleteByTaskId filters by identityId (residual 153)', () => {
    expect(prisma).toContain('async deleteByTaskId(identityId: string, taskId: string)');
    expect(prisma).toContain('identityId,');
    expect(prisma).toContain('OR: [{ predecessorTaskId: taskId }, { successorTaskId: taskId }]');
  });

  it('powersync deleteByTaskId filters by identity_id (residual 153)', () => {
    expect(powersync).toContain(
      'DELETE FROM task_dependencies WHERE identity_id = ? AND (predecessor_task_id = ? OR successor_task_id = ?)',
    );
  });

});

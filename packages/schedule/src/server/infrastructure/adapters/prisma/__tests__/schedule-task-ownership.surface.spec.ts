import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Schedule task ownership surface (stage-6 residual 121):
 * get/update/delete/actions and identity-filtered lists must never authorize
 * by bare schedule task primary key alone.
 */
describe('schedule task ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-schedule-task-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(
    resolve(__dirname, '../schedule-task-prisma.repository.ts'),
    'utf8',
  );
  const getUseCase = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/queries/get-schedule-task.use-case.ts',
    ),
    'utf8',
  );
  const deleteUseCase = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/delete-schedule-task.use-case.ts',
    ),
    'utf8',
  );
  const routes = readFileSync(resolve(__dirname, '../../../../../api/routes.ts'), 'utf8');
  const electron = readFileSync(
    resolve(__dirname, '../../../../../electron/index.ts'),
    'utf8',
  );
  const module = readFileSync(
    resolve(__dirname, '../../../schedule.module.ts'),
    'utf8',
  );

  it('port findByIdForIdentity and deleteById require identityId', () => {
    expect(port).toContain(
      'findByIdForIdentity(identityId: string, id: string): Promise<ScheduleTask | null>;',
    );
    expect(port).toContain('deleteById(identityId: string, id: string): Promise<void>;');
  });

  it('prisma filters by id + identityId', () => {
    expect(prisma).toContain('where: { id, identityId }');
    expect(prisma).toContain('deleteMany({');
    expect(prisma).toContain(
      "throw new Error('Schedule task not found for the current identity.');",
    );
  });

  it('get/delete use cases load via findByIdForIdentity', () => {
    expect(getUseCase).toContain('findByIdForIdentity(identityId, id)');
    expect(getUseCase).toMatch(/execute\(id: string, identityId: string\)/);
    expect(deleteUseCase).toContain('findByIdForIdentity(identityId, id)');
    expect(deleteUseCase).toContain('deleteById(identityId, id)');
  });

  it('module list by status/source passes identityId', () => {
    expect(module).toContain('listScheduleTasksByStatus.execute(');
    expect(module).toMatch(
      /listScheduleTasksByStatus\.execute\(\s*query\.status as ScheduleTaskStatus,\s*ctx\.identityId,/,
    );
    expect(module).toMatch(/listScheduleTasksBySource\.execute\([\s\S]*ctx\.identityId/);
  });

  it('HTTP and Electron task get/delete pass identity context', () => {
    expect(routes).toContain('controller.getTask(req.params!.id, ctx)');
    expect(routes).toContain('controller.deleteTask(req.params!.id, ctx)');
    expect(routes).toContain('controller.pauseTask(req.params!.id, ctx)');
    expect(electron).toMatch(
      /TASK_GET_BY_ID[\s\S]*taskController\.getTask\(taskId, requestContext\)/,
    );
    expect(electron).toMatch(
      /TASK_DELETE[\s\S]*taskController\.deleteTask\(taskId, requestContext\)/,
    );
    expect(electron).not.toMatch(
      /TASK_GET_BY_ID[\s\S]*async \(\) => taskController\.getTask\(taskId\)/,
    );
  });
});

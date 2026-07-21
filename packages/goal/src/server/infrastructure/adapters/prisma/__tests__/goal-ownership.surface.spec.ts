import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Goal ownership surface (stage-6 residual 117/118):
 * get/update/delete + status mutations + record create/delete must identity-scope
 * repository reads — never authorize by bare goal/record primary key alone.
 */
describe('goal ownership surface', () => {
  const port = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-goal-repository.ts'),
    'utf8',
  );
  const recordPort = readFileSync(
    resolve(__dirname, '../../../../domain/repositories/i-goal-record-repository.ts'),
    'utf8',
  );
  const prisma = readFileSync(resolve(__dirname, '../goal-prisma.repository.ts'), 'utf8');
  const recordPrisma = readFileSync(
    resolve(__dirname, '../goal-record-prisma.repository.ts'),
    'utf8',
  );
  const getUseCase = readFileSync(
    resolve(__dirname, '../../../../application/use-cases/queries/get-goal.use-case.ts'),
    'utf8',
  );
  const getAggregate = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/queries/get-goal-aggregate.use-case.ts',
    ),
    'utf8',
  );
  const createRecord = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/create-goal-record.use-case.ts',
    ),
    'utf8',
  );
  const deleteRecord = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/delete-goal-record.use-case.ts',
    ),
    'utf8',
  );
  const archiveUseCase = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/archive-goal.use-case.ts',
    ),
    'utf8',
  );
  const activateUseCase = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/activate-goal.use-case.ts',
    ),
    'utf8',
  );
  const completeUseCase = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/complete-goal.use-case.ts',
    ),
    'utf8',
  );
  const permanentUseCase = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/permanently-delete-goal.use-case.ts',
    ),
    'utf8',
  );
  const routes = readFileSync(
    resolve(__dirname, '../../../../../api/routes/goal.routes.ts'),
    'utf8',
  );
  const recordRoutes = readFileSync(
    resolve(__dirname, '../../../../../api/routes/goal-record.routes.ts'),
    'utf8',
  );
  const electron = readFileSync(
    resolve(__dirname, '../../../../../electron/index.ts'),
    'utf8',
  );

  it('port findByIdForIdentity requires identityId', () => {
    expect(port).toContain(
      'findByIdForIdentity(\n    identityId: string,\n    id: string,\n    options?: { includeChildren?: boolean },\n  ): Promise<Goal | null>;',
    );
    expect(port).toContain('delete(identityId: string, id: string): Promise<void>;');
    expect(recordPort).toContain(
      'findByIdForIdentity(identityId: string, recordId: string): Promise<GoalRecord | null>;',
    );
    expect(recordPort).toContain(
      'delete(identityId: string, recordId: string): Promise<void>;',
    );
  });

  it('prisma filters by id + identityId', () => {
    expect(prisma).toContain('where: { id, identityId }');
    expect(prisma).toContain('deleteMany({');
    expect(prisma).toContain(
      "throw new Error('Goal not found for the current identity.');",
    );
    expect(recordPrisma).toContain('where: { id: recordId, identityId }');
    expect(recordPrisma).toContain('deleteMany({');
    expect(recordPrisma).toContain(
      "throw new Error('Goal record not found for the current identity.');",
    );
  });

  it('get and aggregate use cases load via findByIdForIdentity', () => {
    expect(getUseCase).toContain('findByIdForIdentity(identityId, id,');
    expect(getUseCase).toMatch(
      /execute\(\s*id: string,\s*identityId: string,\s*includeChildren\?: boolean/,
    );
    expect(getAggregate).toContain('findByIdForIdentity(identityId, goalId,');
    expect(getAggregate).toMatch(/execute\(goalId: string, identityId: string\)/);
  });

  it('record create/delete identity-scope owned reads', () => {
    expect(createRecord).toContain('findByIdForIdentity(identityId, goalId,');
    expect(deleteRecord).toContain('findByIdForIdentity(identityId, recordId)');
    expect(deleteRecord).toContain('delete(identityId, recordId)');
    expect(deleteRecord).toMatch(/execute\(recordId: string, identityId: string\)/);
  });

  it('status mutation use cases load via findByIdForIdentity', () => {
    expect(archiveUseCase).toContain('findByIdForIdentity(identityId, id)');
    expect(archiveUseCase).toMatch(/execute\(id: string, identityId: string\)/);
    expect(activateUseCase).toContain('findByIdForIdentity(identityId, id)');
    expect(completeUseCase).toContain('findByIdForIdentity(identityId, id)');
    expect(permanentUseCase).toContain('findByIdForIdentity(identityId, id,');
    expect(permanentUseCase).toContain('delete(identityId, id)');
  });

  it('HTTP and Electron get/update/delete/record pass identity context', () => {

    expect(routes).toContain('controller.get(');
    expect(routes).toMatch(/controller\.get\(\s*req\.params!\.id,\s*ctx,/);
    expect(routes).toContain('controller.update(req.params!.id, req.body, ctx)');
    expect(routes).toContain('controller.delete(req.params!.id, ctx)');
    expect(routes).toContain('controller.getAggregate(req.params!.id, ctx)');
    expect(recordRoutes).toContain('controller.deleteRecord(req.params!.recordId, ctx)');
    expect(electron).toMatch(
      /GoalChannels\.GET[\s\S]*goalController\.get\(id, requestContext, includeChildren\)/,
    );
    expect(electron).toMatch(
      /GoalChannels\.UPDATE[\s\S]*goalController\.update\(id, dto, requestContext\)/,
    );
    expect(electron).toMatch(
      /GoalChannels\.DELETE[\s\S]*goalController\.delete\(id, requestContext\)/,
    );
    expect(electron).toMatch(
      /GoalChannels\.AGGREGATE[\s\S]*goalController\.getAggregate\(id, requestContext\)/,
    );
    expect(electron).toMatch(
      /RECORD_DELETE[\s\S]*goalController\.deleteRecord\(recordId, requestContext\)/,
    );
    expect(electron).not.toMatch(
      /GoalChannels\.GET, \(_event, id, includeChildren = true\) =>\s*goalController\.get\(id, includeChildren\)/,
    );
    expect(routes).toContain('controller.archive(req.params!.id, ctx)');
    expect(routes).toContain('controller.activate(req.params!.id, ctx)');
    expect(routes).toContain('controller.complete(req.params!.id, ctx)');
    expect(electron).toMatch(
      /GoalChannels\.ARCHIVE[\s\S]*goalController\.archive\(id, requestContext\)/,
    );
    expect(electron).toMatch(
      /GoalChannels\.ACTIVATE[\s\S]*goalController\.activate\(id, requestContext\)/,
    );
    expect(electron).toMatch(
      /GoalChannels\.COMPLETE[\s\S]*goalController\.complete\(id, requestContext\)/,
    );
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Goal ownership surface (stage-6 residual 117/118):
 * goal aggregate + status + KR/review + create parent + focus + records/progress must identity-scope
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
  const powersync = readFileSync(
    resolve(__dirname, '../../powersync/goal-powersync.repository.ts'),
    'utf8',
  );
  const recordPrisma = readFileSync(
    resolve(__dirname, '../goal-record-prisma.repository.ts'),
    'utf8',
  );
  const recordPowersync = readFileSync(
    resolve(__dirname, '../../powersync/goal-record-powersync.repository.ts'),
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
  const addKeyResult = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/add-goal-key-result.use-case.ts',
    ),
    'utf8',
  );
  const deleteKeyResult = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/delete-goal-key-result.use-case.ts',
    ),
    'utf8',
  );
  const addReview = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/add-goal-review.use-case.ts',
    ),
    'utf8',
  );
  const deleteReview = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/delete-goal-review.use-case.ts',
    ),
    'utf8',
  );
  const listReviews = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/queries/list-goal-reviews.use-case.ts',
    ),
    'utf8',
  );
  const keyResultRoutes = readFileSync(
    resolve(__dirname, '../../../../../api/routes/key-result.routes.ts'),
    'utf8',
  );
  const reviewRoutes = readFileSync(
    resolve(__dirname, '../../../../../api/routes/review.routes.ts'),
    'utf8',
  );
  const createGoal = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/create-goal.use-case.ts',
    ),
    'utf8',
  );
  const activateFocus = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/commands/activate-focus-mode.use-case.ts',
    ),
    'utf8',
  );
  const listRecords = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/queries/list-goal-records.use-case.ts',
    ),
    'utf8',
  );
  const progressBreakdown = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/queries/get-goal-progress-breakdown.use-case.ts',
    ),
    'utf8',
  );
  const crossModule = readFileSync(
    resolve(
      __dirname,
      '../../../../application/use-cases/queries/goal-cross-module-query-service.use-case.ts',
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

  it('key-result and review use cases load via findByIdForIdentity', () => {
    expect(addKeyResult).toContain('findByIdForIdentity(identityId, goalId,');
    expect(addKeyResult).toMatch(/goalId: string,\s*identityId: string,/);
    expect(deleteKeyResult).toContain('findByIdForIdentity(identityId, goalId,');
    expect(addReview).toContain('findByIdForIdentity(identityId, goalId,');
    expect(deleteReview).toContain('findByIdForIdentity(identityId, goalId,');
    expect(listReviews).toContain('findByIdForIdentity(identityId, goalId,');
    expect(listReviews).toMatch(/execute\(goalId: string, identityId: string\)/);
  });

  it('create parent, focus, records, progress and cross-module use owned reads', () => {
    expect(createGoal).toContain('findByIdForIdentity(\n        cx.identityId,\n        input.parentGoalId,');
    expect(activateFocus).toContain('findByIdForIdentity(identityId, goalId)');
    expect(listRecords).toContain('identityId: string;');
    expect(listRecords).toContain('findByIdForIdentity(identityId, goalId,');
    expect(listRecords).toContain('String(record.identityId) === identityId');
    expect(progressBreakdown).toContain('findByIdForIdentity(identityId, goalId,');
    expect(progressBreakdown).toMatch(/execute\(goalId: string, identityId: string\)/);
    expect(crossModule).toContain('findByIdForIdentity(identityId, goalId)');
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
    expect(keyResultRoutes).toContain(
      'controller.addKeyResult(req.params!.id, req.body, ctx)',
    );
    expect(keyResultRoutes).toContain(
      'controller.deleteKeyResult(req.params!.id, req.params!.krId, ctx)',
    );
    expect(reviewRoutes).toContain('controller.addReview(req.params!.id, req.body, ctx)');
    expect(reviewRoutes).toContain(
      'controller.deleteReview(req.params!.id, req.params!.reviewId, ctx)',
    );
    expect(electron).toMatch(
      /KEY_RESULT_ADD[\s\S]*goalController\.addKeyResult\(goalId, dto, requestContext\)/,
    );
    expect(electron).toMatch(
      /KEY_RESULT_DELETE[\s\S]*goalController\.deleteKeyResult\(goalId, keyResultId, requestContext\)/,
    );
    expect(electron).toMatch(
      /REVIEW_CREATE[\s\S]*goalController\.addReview\(goalId, dto, requestContext\)/,
    );
    expect(electron).toMatch(
      /REVIEW_DELETE[\s\S]*goalController\.deleteReview\(goalId, reviewId, requestContext\)/,
    );
    expect(electron).toMatch(
      /KEY_RESULT_BATCH_UPDATE_WEIGHTS[\s\S]*requestContext/,
    );
    expect(routes).toContain('controller.getProgressBreakdown(req.params!.id, ctx)');
    expect(electron).toMatch(
      /PROGRESS_BREAKDOWN[\s\S]*goalController\.getProgressBreakdown\(id, requestContext\)/,
    );
    expect(electron).toMatch(
      /RECORD_LIST_BY_GOAL[\s\S]*listRecordsByGoal\(goalId, params \?\? undefined, requestContext\)/,
    );
    expect(electron).toMatch(
      /RECORD_LIST_BY_KEY_RESULT[\s\S]*requestContext/,
    );
  });

  it('goal record secondary queries require identityId (residual 141)', () => {
    expect(recordPort).toMatch(
      /findByKeyResultId\(\s*identityId: string,\s*keyResultId: string,/,
    );
    expect(recordPort).toMatch(
      /findByGoalId\(\s*identityId: string,\s*goalId: string,/,
    );
    expect(recordPort).toMatch(
      /findByKeyResultIds\(\s*identityId: string,\s*keyResultIds: string\[\],/,
    );
    expect(recordPort).toContain(
      'countByKeyResultId(identityId: string, keyResultId: string): Promise<number>;',
    );
    expect(recordPrisma).toContain('identityId, keyResultId, deletedAt: null');
    expect(prisma).toContain(
      'async findByFolderId(identityId: string, folderId: string)',
    );
    expect(prisma).toContain('where: { identityId, folderId, deletedAt: null, archivedAt: null }');
  });


  it('record port deleteMany requires identityId (residual 154)', () => {
    expect(recordPort).toContain(
      'deleteMany(identityId: string, recordIds: string[]): Promise<void>;',
    );
  });

  it('record prisma/powersync deleteMany filter by identity (residual 154)', () => {
    expect(recordPrisma).toContain(
      'async deleteMany(identityId: string, recordIds: string[])',
    );
    expect(recordPrisma).toContain('where: { id: { in: recordIds }, identityId }');
    expect(recordPowersync).toContain(
      'DELETE FROM goal_records WHERE identity_id = ? AND id IN (${placeholders})',
    );
  });


  it('port exists/batchUpdateStatus require identityId (residual 158)', () => {
    expect(port).toContain('exists(identityId: string, id: string): Promise<boolean>;');
    expect(port).toContain(
      'batchUpdateStatus(identityId: string, ids: string[], status: string): Promise<void>;',
    );
  });

  it('prisma/powersync exists and batchUpdateStatus filter by identity (residual 158)', () => {
    expect(prisma).toContain('async exists(identityId: string, id: string)');
    expect(prisma).toContain('where: { id, identityId }');
    expect(prisma).toContain(
      'async batchUpdateStatus(identityId: string, ids: string[], status: string)',
    );
    expect(prisma).toContain('where: { id: { in: ids }, identityId }');
    expect(powersync).toContain(
      'UPDATE goals SET status = ?, updated_at = ? WHERE identity_id = ? AND id IN (${placeholders})',
    );
  });

});

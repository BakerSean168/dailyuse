import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Goal void-success envelope surface (stage-6 residual 89):
 * remaining void deletes use z.null()/ok(null) like AI residual 87/88 —
 * no DeleteSuccessResSchema `{ success: boolean }` dual-track body.
 */
describe('goal void success envelope surface', () => {
  const reviewRoutes = readFileSync(resolve(__dirname, './review.routes.ts'), 'utf8');
  const recordRoutes = readFileSync(resolve(__dirname, './goal-record.routes.ts'), 'utf8');
  const goalController = readFileSync(
    resolve(__dirname, '../../server/transport/goal.controller.ts'),
    'utf8',
  );
  const folderController = readFileSync(
    resolve(__dirname, '../../server/transport/goal-folder.controller.ts'),
    'utf8',
  );
  const electron = readFileSync(resolve(__dirname, '../../electron/index.ts'), 'utf8');
  const responseSchemas = readFileSync(
    resolve(__dirname, '../../../../contracts/src/modules/goal/api/response-schemas.ts'),
    'utf8',
  );

  it('OpenAPI distinguishes mutation receipts from remaining void deletes', () => {
    expect(reviewRoutes).toContain("successResponse(GoalMutationReceiptSchema, '删除成功')");
    expect(recordRoutes).toContain("successResponse(GoalMutationReceiptSchema, '删除成功')");
    expect(reviewRoutes).not.toContain('DeleteSuccessResSchema');
    expect(recordRoutes).not.toContain('DeleteSuccessResSchema');
    expect(responseSchemas).not.toContain('DeleteSuccessResSchema');
  });

  it('controllers distinguish mutation receipts from void deletes', () => {
    expect(goalController).not.toContain('return ok(null)');
    expect(folderController).toContain('return ok(null)');
    expect(goalController).toMatch(/async deleteKeyResult[\s\S]*?Promise<Result<unknown>>/);
    expect(goalController).toMatch(/async deleteReview[\s\S]*?Promise<Result<unknown>>/);
    expect(goalController).toMatch(/async deleteRecord[\s\S]*?Promise<Result<unknown>>/);
    expect(folderController).toMatch(/async delete[\s\S]*?Promise<Result<null>>/);
  });

  it('Desktop IPC registers all delete handlers and normalizes only void deletes', () => {
    for (const channel of [
      'KEY_RESULT_DELETE',
      'REVIEW_DELETE',
      'RECORD_DELETE',
      'FOLDER_DELETE',
    ]) {
      expect(electron).toContain(`GoalChannels.${channel}`);
    }
    expect(electron.match(/return ok\(null\)/g)?.length ?? 0).toBeGreaterThanOrEqual(1);
  });
});

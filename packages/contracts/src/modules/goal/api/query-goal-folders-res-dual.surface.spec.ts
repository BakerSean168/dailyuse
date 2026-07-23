import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 779: QueryGoalFoldersRes dual body retired.
 * OpenAPI + transport use QueryGoalFoldersResSchema; Res is z.infer alias.
 */
describe('query goal folders res dual retired (residual 779)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'goal-folder.dto.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../goal/src/api/routes/goal-folder.routes.ts'),
    'utf8',
  );

  it('dto owns ResSchema and z.infer alias', () => {
    expect(dto).toContain('Residual 779');
    expect(dto).toContain(
      'export const QueryGoalFoldersResSchema = z.object({',
    );
    expect(dto).toContain(
      'export type QueryGoalFoldersRes = z.infer<typeof QueryGoalFoldersResSchema>',
    );
    expect(dto).toContain('data: z.array(GoalFolderClientDTOSchema)');
    expect(dto).not.toMatch(/export interface QueryGoalFoldersRes\b/);
  });

  it('OpenAPI list route uses shared Res schema without inline dual body', () => {
    expect(routes).toContain('QueryGoalFoldersResSchema');
    expect(routes).toContain(
      "successResponse(QueryGoalFoldersResSchema, '获取成功')",
    );
    expect(routes).not.toMatch(
      /successResponse\(\s*z\.object\(\{\s*data:\s*z\.array\(GoalFolderClientDTOSchema\)/,
    );
  });

  it('imports GoalFolderClientDTOSchema for nested list items', () => {
    expect(dto).toContain("from './response-schemas'");
    expect(dto).toContain('GoalFolderClientDTOSchema');
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Governance void-success envelope surface (stage-6 residual 90):
 * rule delete uses z.null()/ok(null) —
 * no DeleteRuleResSchema `{ success: boolean }` dual-track body.
 */
describe('governance void success envelope surface', () => {
  const rulesRoutes = readFileSync(resolve(__dirname, './governance-rules.routes.ts'), 'utf8');
  const controller = readFileSync(
    resolve(__dirname, '../../server/transport/governance.controller.ts'),
    'utf8',
  );
  const electron = readFileSync(resolve(__dirname, '../../electron/index.ts'), 'utf8');
  const responseSchemas = readFileSync(
    resolve(__dirname, '../../../../contracts/src/modules/governance/api/response-schemas.ts'),
    'utf8',
  );
  const rulesDto = readFileSync(
    resolve(__dirname, '../../../../contracts/src/modules/governance/api/rules.ts'),
    'utf8',
  );
  const deleteRuleUseCase = readFileSync(
    resolve(
      __dirname,
      '../../server/application/use-cases/commands/delete-rule.use-case.ts',
    ),
    'utf8',
  );

  it('OpenAPI void delete uses z.null(), not DeleteRuleResSchema', () => {
    expect(rulesRoutes).toContain("successResponse(z.null(), '删除成功')");
    expect(rulesRoutes).not.toContain('DeleteRuleResSchema');
    expect(responseSchemas).not.toContain('DeleteRuleResSchema');
    expect(rulesDto).toContain('export type DeleteRuleRes = null');
  });

  it('use case / controller return null / ok(null)', () => {
    expect(deleteRuleUseCase).toContain('return null;');
    expect(deleteRuleUseCase).not.toContain('success: true');
    expect(controller).toMatch(/async deleteRule[\s\S]*?Promise<Result<null>>/);
    expect(controller).toContain('return ok(null)');
  });

  it('Desktop IPC RULE_DELETE normalizes to ok(null)', () => {
    expect(electron).toContain('GovernanceChannels.RULE_DELETE');
    expect(electron).toContain('return ok(null)');
  });
});

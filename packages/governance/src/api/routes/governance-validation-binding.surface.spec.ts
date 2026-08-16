/**
 * Governance validation binding surface (Phase 4 pilot).
 *
 * The migrated create-rule mutation must bind the SAME `CreateRuleSchema`
 * object in the route's OpenAPI request registration AND its runtime
 * validation binding (`routeWithValidation`), and the controller must no
 * longer `safeParse` that schema (adapter owns transport shape validation).
 *
 * 已迁移的 create-rule mutation 必须在路由的 OpenAPI request 注册与 runtime
 * validation binding（`routeWithValidation`）中绑定同一个 `CreateRuleSchema`
 * 对象；controller 不再 `safeParse` 该 schema（传输形状校验由 adapter 拥有）。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('governance validation binding surface (Phase 4 pilot)', () => {
  const routes = readFileSync(resolve(__dirname, './governance-rules.routes.ts'), 'utf8');
  const controller = readFileSync(
    resolve(__dirname, '../../server/transport/governance.controller.ts'),
    'utf8',
  );

  it('create-rule route binds the same CreateRuleSchema in OpenAPI and validation', () => {
    // OpenAPI body schema references CreateRuleSchema.
    expect(routes).toContain('schema: CreateRuleSchema');
    // Runtime validation binding references the same schema object.
    expect(routes).toMatch(/validation:\s*\{\s*schema:\s*CreateRuleSchema\s*\}/);
    // The validation-aware registrar is used (not the raw expressAdapter).
    expect(routes).toContain('routeWithValidation');
  });

  it('controller createRule no longer safeParses the migrated schema', () => {
    expect(controller).toMatch(/async createRule\(\s*input:\s*CreateRuleReq/);
    expect(controller).not.toMatch(/CreateRuleSchema\.safeParse/);
  });
});

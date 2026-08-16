/**
 * Goal RPC map surface spec (Phase 4 transport parity ledger).
 *
 * Enumerates every Goal mutation ledger row and detects missing schema/type
 * references before transport migration. The RPC map must import only the
 * inferred request/response types from `../api` (no inline object types).
 *
 * 枚举 Goal 全部 mutation ledger 行，并在 transport 迁移前发现缺失的
 * schema/type 引用。RPC map 只能从 `../api` 导入推导出的请求/响应类型，
 * 禁止内联 object type。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { GoalRpcMap } from './goal-rpc-map';
import type {
  UpdateGoalFolderInvocation,
  DeleteGoalFolderInvocation,
} from '../api/goal-invocation.schemas';
import type { UpdateGoalFolderRes } from '../api/goal-folder.dto';

const protocolDir = __dirname;
const rpcMapFile = resolve(protocolDir, 'goal-rpc-map.ts');
const rpcMap = readFileSync(rpcMapFile, 'utf8');

/**
 * Ledger rows owned by this module. Each mutation must reference a real
 * request schema + response type once contracts are closed. Void rows carry
 * no body (identity-scoped commands).
 */
const GOAL_LEDGER = [
  ['goal:create', 'CreateGoalSchema', 'GoalMutationReceipt'],
  ['goal:update', 'UpdateGoalSchema', 'GoalMutationReceipt'],
  ['goal:delete', 'GoalVersionCommandSchema', 'GoalMutationReceipt'],
  ['goal:archive-expired', 'void', 'ArchiveExpiredRes'],
  ['goal:archive', 'GoalVersionCommandSchema', 'GoalMutationReceipt'],
  ['goal:activate', 'GoalVersionCommandSchema', 'GoalMutationReceipt'],
  ['goal:complete', 'GoalVersionCommandSchema', 'GoalMutationReceipt'],
  ['goal:clone', 'CloneGoalSchema', 'GoalMutationReceipt'],
  ['key-result:add', 'AddKeyResultSchema', 'GoalMutationReceipt'],
  ['key-result:update', 'UpdateKeyResultSchema', 'GoalMutationReceipt'],
  ['key-result:progress', 'UpdateKeyResultProgressSchema', 'GoalMutationReceipt'],
  ['key-result:delete', 'DeleteKeyResultSchema', 'GoalMutationReceipt'],
  ['key-result:batch-weights', 'BatchUpdateKeyResultWeightsReqSchema', 'GoalMutationReceipt'],
  ['goal:review:create', 'CreateGoalReviewSchema', 'GoalMutationReceipt'],
  ['goal:review:update', 'UpdateGoalReviewSchema', 'GoalMutationReceipt'],
  ['goal:review:delete', 'DeleteGoalReviewSchema', 'GoalMutationReceipt'],
  ['goal:record:create', 'CreateGoalRecordSchema', 'GoalMutationReceipt'],
  ['goal:record:delete', 'DeleteGoalRecordSchema', 'GoalMutationReceipt'],
  ['focus:activate', 'ActivateFocusModeSchema', 'FocusModeDTO'],
  ['focus:deactivate', 'void', 'FocusModeDTO'],
  ['focus:extend', 'ExtendFocusModeSchema', 'FocusModeDTO'],
  ['goal-folder:create', 'CreateGoalFolderSchema', 'GoalFolderClientDTO'],
  ['goal-folder:update', 'UpdateGoalFolderSchema', 'GoalFolderClientDTO'],
  ['goal-folder:delete', 'void', 'null'],
] as const;

const API_DTO_FILES = [
  'goal-crud.dto.ts',
  'key-result.dto.ts',
  'goal-review.dto.ts',
  'goal-record.dto.ts',
  'goal-folder.dto.ts',
  'focus-session.dto.ts',
  'response-schemas.ts',
] as const;

function readApiFile(name: string): string {
  return readFileSync(resolve(protocolDir, `../api/${name}`), 'utf8');
}

describe('goal RPC map surface (Phase 4 ledger)', () => {
  it('imports request/response types only from ../api', () => {
    const imports = [...rpcMap.matchAll(/^import type .* from '(\.[^']+)'/gm)].map((m) => m[1]);
    expect(imports.length).toBeGreaterThan(0);
    for (const specifier of imports) {
      expect(specifier, `import from '${specifier}'`).toMatch(/^\.\.\/api($|\/)/);
    }
  });

  it('defines no inline object types inside the map body', () => {
    const mapBody = rpcMap.split('export type GoalRpcMap = {')[1] ?? '';
    expect(mapBody).not.toMatch(/=\s*\{/);
    expect(mapBody).not.toMatch(/z\./);
  });

  it('every ledger request schema is exported from the goal api', () => {
    const apiSources = [
      ...API_DTO_FILES.map(readApiFile),
      readFileSync(resolve(protocolDir, '../value-objects/focus-mode.ts'), 'utf8'),
    ].join('\n');
    for (const [, requestSchema] of GOAL_LEDGER) {
      if (requestSchema === 'void') continue;
      const schemaRegex = new RegExp(`export (const|type) ${requestSchema}\\b`);
      expect(apiSources, `request schema ${requestSchema} must be exported from goal api`).toMatch(
        schemaRegex,
      );
    }
  });

  it('ledger response types resolve to response-schemas or the matching dto', () => {
    const responseSchemas = readApiFile('response-schemas.ts');
    expect(responseSchemas).toContain('export const GoalMutationReceiptSchema');
    expect(responseSchemas).toContain('export type GoalMutationReceipt =');
    expect(responseSchemas).toContain('export const ArchiveExpiredResSchema');
    expect(responseSchemas).toContain('export const BatchUpdateKeyResultWeightsReqSchema');
    expect(readApiFile('goal-folder.dto.ts')).toContain('QueryGoalFoldersResSchema');
    expect(readApiFile('focus-session.dto.ts')).toContain('FocusSessionClientDTOSchema');
    expect(readFileSync(resolve(protocolDir, '../value-objects/focus-mode.ts'), 'utf8')).toContain(
      'export type FocusModeDTO = z.infer<typeof FocusModeClientDTOSchema>',
    );
  });

  it('imported names are all referenced by the map body (no dead imports)', () => {
    const imported = [...rpcMap.matchAll(/^import type \{([^}]+)\} from /gm)].flatMap((m) =>
      m[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    const mapBody = rpcMap.split('export type GoalRpcMap')[1] ?? '';
    for (const name of imported) {
      expect(mapBody, `imported ${name} must be referenced by GoalRpcMap`).toContain(name);
    }
  });

  it('every ledger row has a map entry (mutation ledger completeness)', () => {
    const mapBody = rpcMap.split('export type GoalRpcMap')[1] ?? '';
    for (const [key] of GOAL_LEDGER) {
      expect(mapBody, `ledger row ${key} must have a GoalRpcMap entry`).toContain(`'${key}':`);
    }
  });

  it('goal-folder tuples use the named invocation and response types (compile-time)', () => {
    expectTypeOf<GoalRpcMap['goal-folder:update']>().toEqualTypeOf<
      [UpdateGoalFolderInvocation, UpdateGoalFolderRes]
    >();
    expectTypeOf<GoalRpcMap['goal-folder:delete']>().toEqualTypeOf<
      [DeleteGoalFolderInvocation, null]
    >();
  });
});

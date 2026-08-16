/**
 * Production transport cast inventory surface (Phase 4, Step 5).
 *
 * After Phase 4, production transport DTO / application-boundary / Prisma-row
 * conversions must use named mappers — NOT `as unknown as` casts. Test fixtures
 * (`*.spec.ts` / `*.test.ts` / `testing/`) are excluded. This spec enumerates
 * the production cast ALLOWLIST (low-level native/transaction/SSE/runtime
 * structural casts that cannot be expressed from contract types) and fails if
 * any NEW cross-boundary DTO cast appears in the audited boundary paths.
 *
 * Phase 4 后，生产 transport DTO / application 边界 / Prisma-row 转换必须使用
 * 命名 mapper，而不是 `as unknown as` 强转。test fixture（`*.spec.ts` /
 * `*.test.ts` / `testing/`）不在审计范围。本 spec 枚举生产 cast allowlist
 * （无法从 contract 类型表达的低层 native/transaction/SSE/runtime 结构强转），
 * 并在审计边界路径中出现任何新的跨边界 DTO 强转时失败。
 */
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../../../../');

/** Boundary paths audited for cross-boundary DTO casts. 审计的边界路径。 */
const AUDITED_PATHS = [
  'packages/goal/src/api/routes',
  'packages/goal/src/server/transport',
  'packages/goal/src/server/application',
  'packages/goal/src/infrastructure-client/adapters/ipc',
  'packages/task/src/api/routes',
  'packages/task/src/server/transport',
  'packages/task/src/server/application',
  'packages/task/src/application-client',
  'packages/task/src/infrastructure-client/adapters/ipc',
  'packages/notification/src/api',
  'packages/notification/src/server/transport',
  'packages/notification/src/infrastructure-client/adapters/http',
  'packages/notification/src/infrastructure-client/adapters/ipc',
  'packages/notification/src/server/infrastructure/adapters/prisma/mappers',
] as const;

/**
 * Production cast allowlist (file → reason). Each entry is a low-level native /
 * transaction / SSE / runtime structural cast that cannot be expressed from
 * contract types without a broad Record fallback.
 * 生产 cast allowlist（file → 原因）。每条都是无法从 contract 类型表达的低层
 * native/transaction/SSE/runtime 结构强转，不能退化为宽泛 Record。
 */
const ALLOWLIST: Record<string, string> = {
  // Goal: low-level transaction runner native handle (Prisma transaction client).
  'packages/goal/src/server/infrastructure/adapters/prisma/prisma-goal-write-transaction-runner.ts':
    'native Prisma transaction client cast (allowlist)',
  // Task: outbox event versioned cast (reliable-messaging version boundary).
  'packages/task/src/server/application/outbox/task-goal-outbox-dispatcher.ts':
    'outbox event version boundary (allowlist)',
  // Notification: low-level reliable-operation adapter mutates native Prisma
  // return `applied` flag on the wire.
  'packages/notification/src/server/infrastructure/adapters/prisma/notification-reliable-operation-prisma.adapter.ts':
    'native Prisma return mutation (allowlist)',
  // Notification SSE: stream adapter flush + event id structural probing.
  'packages/notification/src/api/routes.ts': 'SSE stream adapter structural casts (allowlist)',
};

function listSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const { readdirSync } = require('node:fs') as typeof import('node:fs');
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = resolve(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (
        entry.name.endsWith('.ts') &&
        !entry.name.endsWith('.spec.ts') &&
        !entry.name.endsWith('.test.ts')
      ) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out;
}

describe('production transport cast inventory (Phase 4 Step 5)', () => {
  it('no new cross-boundary `as unknown as` casts appear in audited paths', () => {
    const violations: string[] = [];

    for (const rel of AUDITED_PATHS) {
      const abs = resolve(ROOT, rel);
      for (const file of listSourceFiles(abs)) {
        const relPath = file.replace(`${ROOT}/`, '');
        if (ALLOWLIST[relPath]) continue;
        const src = readFileSync(file, 'utf8');
        const lines = src.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('as unknown as')) {
            // Ignore comment lines that merely mention the cast pattern.
            const stripped = line.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '');
            if (stripped.includes('as unknown as')) {
              violations.push(`${relPath}:${idx + 1}: ${line.trim()}`);
            }
          }
        });
      }
    }

    expect(violations).toEqual([]);
  });

  it('every allowlist entry still contains at least one production cast (no stale entries)', () => {
    for (const [relPath, reason] of Object.entries(ALLOWLIST)) {
      const file = resolve(ROOT, relPath);
      const src = readFileSync(file, 'utf8');
      const lines = src.split('\n');
      const hasCast = lines.some((line) => {
        const stripped = line.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '');
        return stripped.includes('as unknown as');
      });
      expect(hasCast, `${relPath} (${reason}) must still contain a production cast`).toBe(true);
    }
  });
});

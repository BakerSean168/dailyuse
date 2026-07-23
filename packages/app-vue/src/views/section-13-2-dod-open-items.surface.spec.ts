import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 891: honest §13.2 completion-definition open-items re-audit.
 * Residual 1143: tip focused suite pointer refresh (Residual 1142 evidence tip 343/1484)
 * without checkbox flips; reaffirms loadWorkspaceEnv + toast-only + parseJson family +
 * asRecord/toRecord + toTimestamp + toNumber + toStringArray + toBoolean + optionalString/toNonEmptyString +
 * asNonEmptyString dual-retired + toDate/toDateString + extractErrorMessage dual-retired + generateUUID + newId +
 * isPlainObject + toMillis + clampPercentage + isRecord keep-boundaries (no force-merge).
 * Residual 893 (soft): OAuthProvider transport≠domain keep-boundary is separate contracts surface.
 * Residual 1047 (soft): loadWorkspaceEnv keep-boundary surface remains locked in api package.
 * Residual 1137 (soft): prior tip refresh 341/1476 still in history notes only.
 * Does not flip any §13.2 checkbox; focused suite tip remains evidence, not full PR gate.
 */
describe('§13.2 DoD open items honest audit (residual 891)', () => {
  const plan = readFileSync(
    resolve(
      __dirname,
      '../../../../docs/plan/active/2026-07-16-obsidian-vault-repository-optimization.md',
    ),
    'utf8',
  );
  const threeLogin = readFileSync(resolve(__dirname, 'three-login-surface.matrix.spec.ts'), 'utf8');

  function section132(): string {
    const start = plan.indexOf('### 13.2');
    expect(start).toBeGreaterThanOrEqual(0);
    const end = plan.indexOf('## 14', start);
    return plan.slice(start, end > start ? end : undefined);
  }

  it('keeps exactly three unchecked §13.2 items with partial/external-block labels', () => {
    expect(plan).toContain('Residual 891');
    expect(plan).toContain('残留八百九十一轮');
    expect(plan).toContain('Residual 1143');
    expect(plan).toContain('残留一千一百四十三轮');
    const sec = section132();
    const unchecked = sec.match(/- \[ \]/g) ?? [];
    const checked = sec.match(/- \[x\]/g) ?? [];
    expect(unchecked).toHaveLength(3);
    expect(checked.length).toBeGreaterThanOrEqual(12);

    expect(sec).toContain('- [ ] 账密、GitHub 和访客入口均可用。 **（部分实现）**');
    expect(sec).toContain(
      '- [ ] Agent 上下文不能逃逸 Vault、执行代码、扩大授权或绕过用户确认。 **（部分实现）**',
    );
    expect(sec).toContain(
      '- [ ] 相关 lint、typecheck、test、Web/Desktop E2E、governance 和 prod-like 验收通过。 **（部分验证 + 外部阻塞）**',
    );
    expect(sec).not.toContain(
      '- [x] 账密、GitHub 和访客入口均可用。',
    );
    expect(sec).not.toContain(
      '- [x] Agent 上下文不能逃逸 Vault、执行代码、扩大授权或绕过用户确认。',
    );
    expect(sec).not.toContain(
      '- [x] 相关 lint、typecheck、test、Web/Desktop E2E、governance 和 prod-like 验收通过。',
    );
  });

  it('records tip focused suite evidence without claiming full PR gate completion', () => {
    const sec = section132();
    expect(sec).toContain('343 文件 / 1484 测试');
    expect(sec).toContain('Residual 1142');
    expect(sec).toContain('Residual 1143');
    expect(sec).toContain('GOV_EXIT:0');
    expect(sec).toContain('不改 checkbox');
    expect(sec).toContain('三入口完整 E2E');
    expect(sec).toContain('Agent multi-engine');
    expect(sec).toContain('全量 PR 门禁');
    expect(sec).toContain('createGoalErrorHandler');
    expect(sec).toContain('schedule route parsers keep-boundary');
    expect(sec).toContain('parseJsonLikeString');
    expect(sec).toContain('parseJsonField');
    expect(sec).toContain('asRecord/toRecord');
    expect(sec).toContain('toTimestamp');
    expect(sec).toContain('toNumber');
    expect(sec).toContain('toStringArray');
    expect(sec).toContain('toBoolean');
    expect(sec).toContain('optionalString');
    expect(sec).toContain('asNonEmptyString');
    expect(sec).toContain('toDate');
    expect(sec).toContain('extractErrorMessage');
    expect(sec).toContain('generateUUID');
    expect(sec).toContain('newId');
    expect(sec).toContain('isPlainObject');
    expect(sec).toContain('toMillis');
    expect(sec).toContain('isRecord');
    expect(sec).not.toMatch(/全量 PR 门禁.*已证明/);
    expect(sec).not.toContain('focused evidence suite tip（Residual 1136）：**341 文件 / 1476 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1132）：**340 文件 / 1472 测试**');
    expect(sec).not.toContain('focused evidence suite tip（Residual 1128）：**339 文件 / 1468 测试**');
  });

  it('three-login matrix remains source/fixture evidence only (not real OAuth E2E)', () => {
    expect(threeLogin).toContain('three-login');
    expect(threeLogin).toContain('not a real GitHub/OAuth E2E');
    expect(threeLogin).toContain('enterGuestMode');
    expect(threeLogin).toMatch(/GitHub OAuth/i);
    expect(section132()).toContain('账密、GitHub 和访客入口均可用。 **（部分实现）**');
  });
});

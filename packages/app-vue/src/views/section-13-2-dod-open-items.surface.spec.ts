import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 891: honest §13.2 completion-definition open-items re-audit.
 * Locks the three still-unchecked DoD items as partial/external-block only.
 * Residual 893 (soft): OAuthProvider transport≠domain keep-boundary is separate contracts surface.
 * Residual 930 (soft): tip focused suite numbers track Residual 930 evidence tip (258/1158).
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
    expect(plan).toContain('Residual 891');
    expect(plan).toContain('残留八百九十一轮');
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
    // Must not claim complete for open items
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
    expect(sec).toContain('258 文件 / 1158 测试');
    expect(sec).toContain('Residual 930');
    expect(sec).toContain('GOV_EXIT:0');
    expect(sec).toContain('不改 checkbox');
    expect(sec).toContain('三入口完整 E2E');
    expect(sec).toContain('Agent multi-engine');
    expect(sec).toContain('全量 PR 门禁');
    // Honest: partial suite is not full PR gate
    expect(sec).not.toMatch(/全量 PR 门禁.*已证明/);
  });

  it('three-login matrix remains source/fixture evidence only (not real OAuth E2E)', () => {
    expect(threeLogin).toContain('three-login');
    expect(threeLogin).toContain('not a real GitHub/OAuth E2E');
    // Guest Desktop-only + GitHub OAuth AuthApp-only boundaries still present
    expect(threeLogin).toContain('enterGuestMode');
    expect(threeLogin).toMatch(/GitHub OAuth/i);
    // Open DoD item still partial in plan
    expect(section132()).toContain('账密、GitHub 和访客入口均可用。 **（部分实现）**');
  });
});

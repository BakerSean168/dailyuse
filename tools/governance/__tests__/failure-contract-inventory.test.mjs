import { describe, expect, it } from 'vitest';
import {
  FAILURE_CONTRACT_RULES,
  evaluateFailureContractInventory,
  fingerprintFailureFindings,
  isFailureContractProductionPath,
  scanFailureContractSource,
} from '../lib/failure-contract-inventory.mjs';

function ruleIds(content, file = 'packages/account/src/server/application/close-account.ts') {
  return scanFailureContractSource(content, file).map((finding) => finding.ruleId);
}

describe('failure contract source inventory', () => {
  it('finds message parsing and raw Result message rethrow', () => {
    const rules = ruleIds(`
      if (error.message.includes('Account not found')) return;
      if (errorMsg.match(/timeout/i)) return;
      throw new Error(result.error.message);
    `);

    expect(rules).toContain(FAILURE_CONTRACT_RULES.MessageBranch);
    expect(rules).toContain(FAILURE_CONTRACT_RULES.RawMessageRethrow);
  });

  it('only flags RawResultMessage rethrow for result-failure contexts, not generic labels', () => {
    const rawRethrow = FAILURE_CONTRACT_RULES.RawMessageRethrow;

    expect(
      ruleIds(`throw new Error(\`${'${message}'}: \${JSON.stringify(value)}\`);`),
    ).not.toContain(rawRethrow);
    expect(ruleIds(`throw new Error(message ?? 'waitFor timed out');`)).not.toContain(rawRethrow);
    expect(ruleIds(`throw new Error('Required module failed: ' + err.message);`)).not.toContain(
      rawRethrow,
    );
    expect(ruleIds(`throw new Error(e.message);`)).not.toContain(rawRethrow);

    expect(ruleIds(`throw new Error(result.error.message);`)).toContain(rawRethrow);
    expect(ruleIds(`throw new Error(envelope.error.message);`)).toContain(rawRethrow);
    expect(ruleIds(`throw new Error(x.failure.message);`)).toContain(rawRethrow);
    expect(ruleIds(`throw new Error(exception.failure.message);`)).toContain(rawRethrow);
    expect(ruleIds(`throw new Error(errorMessage);`)).not.toContain(rawRethrow);
    expect(ruleIds(`throw new Error(errMsg);`)).not.toContain(rawRethrow);
  });

  it('ignores message shape guards and business objects named message', () => {
    expect(
      ruleIds(`
        if (typeof error.message === 'string') return;
        if (message.role === 'user') return;
        if (message.tokenCount != null) return;
      `),
    ).not.toContain(FAILURE_CONTRACT_RULES.MessageBranch);
  });

  it('finds direct UI raw-message ownership', () => {
    const findings = scanFailureContractSource(
      `errorMessage.value = result.error.message;`,
      'packages/app-vue/src/modules/repository/use-repository.ts',
    );

    expect(findings).toEqual([
      expect.objectContaining({ ruleId: FAILURE_CONTRACT_RULES.UiRawMessage }),
    ]);
  });

  it('finds provider vocabulary outside adapters and permits adapter-private parsing', () => {
    expect(
      ruleIds(`if (code === 'EMAIL_NOT_VERIFIED') return;`, 'apps/web/src/auth/use-auth.ts'),
    ).toContain(FAILURE_CONTRACT_RULES.ProviderLeakage);

    expect(
      scanFailureContractSource(
        `if (code === 'EMAIL_NOT_VERIFIED') return;`,
        'packages/cloud-auth/src/server/infrastructure/adapters/better-auth.mapper.ts',
      ),
    ).toHaveLength(0);
  });

  it('finds new DomainError subclasses', () => {
    expect(ruleIds(`export class AccountMissingError extends DomainError {}`)).toContain(
      FAILURE_CONTRACT_RULES.DomainErrorSubclass,
    );
  });

  it('excludes tests, stories, generated files and non-source paths', () => {
    for (const file of [
      'packages/account/src/example.spec.ts',
      'packages/account/src/__tests__/example.ts',
      'apps/web/e2e/auth.spec.ts',
      'apps/web/playwright-local-docker-report/trace/sw.bundle.js',
      'packages/contracts/dist/result.js',
      'docs/audit/example.md',
    ]) {
      expect(isFailureContractProductionPath(file)).toBe(false);
      expect(scanFailureContractSource(`error.message.includes('x')`, file)).toHaveLength(0);
    }
  });
});

describe('failure contract baseline', () => {
  it('keeps fingerprints stable across unrelated line movement', () => {
    const first = fingerprintFailureFindings(
      scanFailureContractSource(
        `if (error.message.includes('x')) return;`,
        'packages/account/src/server/application/example.ts',
      ),
    );
    const moved = fingerprintFailureFindings(
      scanFailureContractSource(
        `\n\nif (error.message.includes('x')) return;`,
        'packages/account/src/server/application/example.ts',
      ),
    );

    expect(first[0].fingerprint).toBe(moved[0].fingerprint);
  });

  it('reports new, expired, and stale entries separately', () => {
    const findings = fingerprintFailureFindings(
      scanFailureContractSource(
        `if (error.message.includes('x')) return;`,
        'packages/account/src/server/application/example.ts',
      ),
    );
    const fingerprint = findings[0].fingerprint;

    expect(
      evaluateFailureContractInventory(
        findings,
        { version: 1, entries: {} },
        new Date('2026-08-17'),
      ).newFindings,
    ).toHaveLength(1);

    const expired = evaluateFailureContractInventory(
      findings,
      {
        version: 1,
        entries: {
          [fingerprint]: {
            owner: 'team',
            reason: 'legacy',
            retireBy: '2026-08-16',
          },
        },
      },
      new Date('2026-08-17T12:00:00Z'),
    );
    expect(expired.newFindings).toHaveLength(0);
    expect(expired.expiredFindings).toHaveLength(1);

    const stale = evaluateFailureContractInventory(
      [],
      {
        version: 1,
        entries: {
          [fingerprint]: {
            owner: 'team',
            reason: 'legacy',
            retireBy: '2026-12-31',
          },
        },
      },
      new Date('2026-08-17'),
    );
    expect(stale.staleEntries).toHaveLength(1);
  });
});

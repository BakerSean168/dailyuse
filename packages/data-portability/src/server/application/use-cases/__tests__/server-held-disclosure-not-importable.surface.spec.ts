import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Server-held disclosure import boundary surface (stage-6 residual 106):
 * disclosure envelopes must never enter the import store transaction path.
 */
describe('server-held disclosure not-importable surface', () => {
  const importSafety = readFileSync(
    resolve(
      __dirname,
      '../../../../../../contracts/src/modules/data-portability/rules/import-safety.ts',
    ),
    'utf8',
  );
  const importUseCase = readFileSync(
    resolve(__dirname, '../import-user-data.use-case.ts'),
    'utf8',
  );
  const exportDisclosure = readFileSync(
    resolve(__dirname, '../export-server-held-data-disclosure.use-case.ts'),
    'utf8',
  );

  it('parseUserDataExportEnvelope fail-closes server-held disclosure kind explicitly', () => {
    expect(importSafety).toContain("kind === 'memoflow.server-held-data-disclosure'");
    expect(importSafety).toContain('not importable');
    expect(importSafety).toContain('memoflow.user-data-export');
  });

  it('import use case only accepts parseUserDataExportEnvelope success', () => {
    expect(importUseCase).toContain('parseUserDataExportEnvelope(raw)');
    expect(importUseCase).toContain('if (!parsed.ok)');
    expect(importUseCase).toContain('throwValidationError(parsed.error)');
  });

  it('export marks disclosure as not-importable product surface', () => {
    expect(exportDisclosure).toContain("kind: 'memoflow.server-held-data-disclosure'");
    expect(exportDisclosure).toContain("importMode: 'not-importable'");
  });
});

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Residual 617: standards ADRs must not prescribe retired ActionResult dual-track.
 * Residual 619: route ADRs must not import removed @dailyuse/contracts/response.
 * Canonical outcome types are Result / IpcResult / HttpResponse only (residual 615).
 */
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../../../');

function readDoc(rel: string): string {
  return readFileSync(join(repoRoot, rel), 'utf8');
}

function readLocal(name: string): string {
  return readFileSync(join(here, name), 'utf8');
}

describe('Result ADR alignment (residual 617)', () => {
  it('result package does not export ActionResult dual helpers', () => {
    const index = readLocal('index.ts');
    expect(index).toContain('Residual 615');
    expect(index).not.toContain("from './action'");
  });

  it('ADR-008/010/012/030 prescribe Result envelopes, not ActionResult duals', () => {
    const adr008 = readDoc('docs/architecture/adr/ADR-008-standard-api-response-format.md');
    const adr010 = readDoc('docs/architecture/adr/ADR-010-standard-centralized-contracts.md');
    const adr012 = readDoc('docs/architecture/adr/ADR-012-standard-error-handling.md');
    const adr030 = readDoc('docs/architecture/adr/ADR-030-standard-result-pattern.md');

    for (const doc of [adr008, adr010, adr012, adr030]) {
      expect(doc).toContain('Residual 617');
      expect(doc).toMatch(/Result<T>/);
    }

    // ADR-008 must not list ActionResult as the prescribed simple-action type.
    expect(adr008).toContain('@dailyuse/contracts/result');
    expect(adr008).toContain('Result<T>');
    expect(adr008).toContain('IpcResult<T>');
    expect(adr008).toContain('HttpResponse<T>');
    expect(adr008).not.toMatch(/\*\s+\*\*Simple Actions:\*\*\s+`ActionResult`/);
    expect(adr008).not.toContain('ActionWithDataResult');
    expect(adr008).not.toContain('BatchActionResult');
    expect(adr008).not.toContain('**Counts:** `CountResult`');

    expect(adr010).toContain('Result<T>');
    expect(adr010).not.toContain('`ActionResult`, `CountResult`');

    expect(adr012).toContain('Result<T>');
    expect(adr012).not.toContain('convert them to `ActionResult`');

    expect(adr030).toContain('@dailyuse/contracts/result');
    expect(adr030).toMatch(/ActionResult.*removed|removed.*ActionResult|dual-track helpers are removed/i);
    expect(adr030).toMatch(/contracts\/response.*removed|removed.*contracts\/response/i);
  });

  it('ADR-021/022 route samples use createHttpResponseBuilder, not contracts/response (residual 619)', () => {
    const adr021 = readDoc('docs/architecture/adr/ADR-021-api-routes-file-organization-strategy.md');
    const adr022 = readDoc('docs/architecture/adr/ADR-022-api-module-routing-refactor.md');
    for (const doc of [adr021, adr022]) {
      expect(doc).toContain('Residual 619');
      expect(doc).toContain('@dailyuse/contracts/result');
      expect(doc).toContain('createHttpResponseBuilder');
      // No live import of the removed response package in samples.
      expect(doc).not.toMatch(/from '@dailyuse\/contracts\/response'/);
      expect(doc).not.toMatch(/createResponseBuilder\s*\(/);
      expect(doc).not.toMatch(/import\s*\{[^}]*createResponseBuilder/);
    }
  });
});

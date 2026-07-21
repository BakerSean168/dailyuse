import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Account void-success envelope surface (stage-6 residual 93):
 * close account uses z.null()/ok(null); dead ImportAccountData success dual-track removed.
 */
describe('account void success envelope surface', () => {
  const routes = readFileSync(resolve(__dirname, './routes.ts'), 'utf8');
  const controller = readFileSync(
    resolve(__dirname, '../server/transport/account.controller.ts'),
    'utf8',
  );
  const electron = readFileSync(resolve(__dirname, '../electron/index.ts'), 'utf8');
  const lifecycle = readFileSync(
    resolve(__dirname, '../../../contracts/src/modules/account/api/account-lifecycle.dto.ts'),
    'utf8',
  );
  const dtosIndex = readFileSync(
    resolve(__dirname, '../../../contracts/src/modules/account/dtos/index.ts'),
    'utf8',
  );

  it('OpenAPI close uses z.null(); CloseAccountRes is null', () => {
    expect(routes).toContain("successResponse(z.null(), '注销成功')");
    expect(lifecycle).toContain('export type CloseAccountRes = null');
    expect(lifecycle).not.toContain('ImportAccountData');
    expect(dtosIndex).not.toContain('ImportAccountDataResultDTO');
  });

  it('controller/electron normalize close to ok(null)', () => {
    expect(controller).toMatch(/async closeAccount[\s\S]*?Promise<Result<null>>/);
    expect(controller).toContain('return ok(null)');
    expect(electron).toContain('AccountChannels.CLOSE');
    expect(electron).toContain('return ok(null)');
  });
});

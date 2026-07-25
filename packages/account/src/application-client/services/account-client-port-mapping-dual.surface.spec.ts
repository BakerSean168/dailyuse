import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 292: AccountClientPort is an intentional mapping dual of IAccountApiClient.
 * Application port returns domain Account; API client returns AccountClientDTO.
 * Do not collapse to a pure type alias (unlike residual 278–288 ClientPort duals).
 */
describe('account client port intentional mapping dual surface', () => {
  const service = readFileSync(resolve(__dirname, 'account-client-service.ts'), 'utf8');
  const port = readFileSync(
    resolve(__dirname, '../ports/account-api-client.port.ts'),
    'utf8',
  );

  it('IAccountApiClient returns AccountClientDTO on profile reads/writes', () => {
    expect(port).toContain('export interface IAccountApiClient');
    expect(port).toMatch(/getMyProfile\(\):\s*Promise<Result<AccountClientDTO>>/);
    expect(port).toMatch(
      /updateMyProfile\(request: UpdateAccountReq\):\s*Promise<Result<AccountClientDTO>>/,
    );
  });

  it('AccountClientPort remains domain-facing with mapAccountResult (not type alias)', () => {
    expect(service).toMatch(/export interface AccountClientPort\s*\{/);
    expect(service).not.toMatch(/export type AccountClientPort\s*=\s*IAccountApiClient/);
    expect(service).toMatch(/getMyProfile\(\):\s*Promise<Result<Account>>/);
    expect(service).toMatch(
      /updateMyProfile\(request: UpdateAccountReq\):\s*Promise<Result<Account>>/,
    );
    expect(service).toContain('implements AccountClientPort');
    expect(service).toContain('function mapAccountResult');
    expect(service).toContain('accountFromDTO');
    expect(service).toContain('return mapAccountResult(result)');
  });
});

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 276: IDataPortabilityApiClient lives in application-client/ports
 * (not adapters/types dual definition).
 */
describe('data-portability api client port single-track surface', () => {
  const port = readFileSync(resolve(__dirname, 'data-portability-api-client.port.ts'), 'utf8');
  const adapterTypes = readFileSync(
    resolve(__dirname, '../../infrastructure-client/adapters/types.ts'),
    'utf8',
  );
  const application = readFileSync(resolve(__dirname, '../index.ts'), 'utf8');

  it('defines IDataPortabilityApiClient in application-client ports', () => {
    expect(port).toContain('export interface IDataPortabilityApiClient');
    expect(existsSync(resolve(__dirname, 'data-portability-api-client.port.ts'))).toBe(true);
  });

  it('adapters/types re-exports port and does not redefine interface', () => {
    expect(adapterTypes).toContain(
      "export type { IDataPortabilityApiClient } from '../../application-client/ports/data-portability-api-client.port'",
    );
    expect(adapterTypes).not.toMatch(/export interface IDataPortabilityApiClient\s*\{/);
  });

  it('application-client imports port from local ports module', () => {
    expect(application).toContain("from './ports/data-portability-api-client.port'");
    expect(application).not.toContain("from '../infrastructure-client/adapters/types'");
  });
});

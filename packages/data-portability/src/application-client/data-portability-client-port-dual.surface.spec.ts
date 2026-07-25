import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 278: DataPortabilityClientPort is a type alias of IDataPortabilityApiClient
 * (no second interface dual body).
 */
describe('data-portability client port dual single-track surface', () => {
  const application = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');
  const port = readFileSync(
    resolve(__dirname, 'ports/data-portability-api-client.port.ts'),
    'utf8',
  );

  it('defines IDataPortabilityApiClient once in ports', () => {
    expect(port).toContain('export interface IDataPortabilityApiClient');
  });

  it('DataPortabilityClientPort is type alias, not a second interface', () => {
    expect(application).toMatch(
      /export type DataPortabilityClientPort\s*=\s*IDataPortabilityApiClient/,
    );
    expect(application).not.toMatch(/export interface DataPortabilityClientPort\s*\{/);
    expect(application).toContain('implements IDataPortabilityApiClient');
  });
});

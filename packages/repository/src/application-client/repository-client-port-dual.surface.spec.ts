import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 284: RepositoryClientPort is a type alias of IRepositoryApiClient
 * (no second interface dual body; pure Result pass-through service).
 */
describe('repository client port dual single-track surface', () => {
  const service = readFileSync(resolve(__dirname, 'repository-client-service.ts'), 'utf8');
  const port = readFileSync(resolve(__dirname, 'ports/repository-api-client.port.ts'), 'utf8');
  const clientPort = readFileSync(resolve(__dirname, 'repository-client.port.ts'), 'utf8');

  it('defines IRepositoryApiClient once in ports', () => {
    expect(port).toContain('export interface IRepositoryApiClient');
    expect(port).toContain('createConfirmedKnowledgeNote');
    expect(port).toContain('writeConfirmedLocalVaultNote');
  });

  it('RepositoryClientPort is type alias, not a second interface', () => {
    expect(clientPort).toMatch(/export type RepositoryClientPort\s*=\s*IRepositoryApiClient/);
    expect(clientPort).not.toMatch(/export interface RepositoryClientPort\s*\{/);
    expect(service).toContain('implements IRepositoryApiClient');
    expect(service).not.toMatch(/implements RepositoryClientPort/);
  });
});

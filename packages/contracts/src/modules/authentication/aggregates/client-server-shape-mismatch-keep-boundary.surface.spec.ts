import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 879: intentional Client≠Server DTO keep-boundary.
 * Shape-mismatch duals must remain separate interface bodies (not type aliases).
 * Does not flip §13.2 checkboxes; OAuth / multi-engine Agent / full PR gate remain open.
 */
describe('client-server shape-mismatch dual keep-boundary (residual 879)', () => {
  const authAgg = __dirname;
  const taskAgg = resolve(authAgg, '../../task/aggregates');

  it('keeps AuthIdentity Client≠Server duals as separate interface bodies', () => {
    const client = readFileSync(resolve(authAgg, 'auth-identity-client.ts'), 'utf8');
    const server = readFileSync(resolve(authAgg, 'auth-identity-server.ts'), 'utf8');
    expect(client).toContain('Residual 879');
    expect(server).toContain('Residual 879');
    expect(client).toMatch(/export interface AuthIdentityClientDTO\b/);
    expect(server).toMatch(/export interface AuthIdentityServerDTO\b/);
    expect(client).not.toContain('export type AuthIdentityClientDTO = AuthIdentityServerDTO');
    expect(server).not.toContain('export type AuthIdentityServerDTO = AuthIdentityClientDTO');
    // Client-only capability flags
    expect(client).toContain('hasPassword: boolean');
    expect(client).toContain('hasEmail: boolean');
    expect(client).toContain('hasPhone: boolean');
    expect(client).toContain('hasOAuth: boolean');
    expect(server).not.toContain('hasPassword: boolean');
    // Server-only oauth bindings
    expect(server).toContain('oauthBindings:');
    expect(client).not.toContain('oauthBindings:');
  });

  it('keeps AuthSession Client≠Server duals as separate interface bodies', () => {
    const client = readFileSync(resolve(authAgg, 'auth-session-client.ts'), 'utf8');
    const server = readFileSync(resolve(authAgg, 'auth-session-server.ts'), 'utf8');
    expect(client).toContain('Residual 879');
    expect(server).toContain('Residual 879');
    expect(client).toMatch(/export interface AuthSessionClientDTO\b/);
    expect(server).toMatch(/export interface AuthSessionServerDTO\b/);
    expect(client).not.toContain('export type AuthSessionClientDTO = AuthSessionServerDTO');
    expect(client).toContain('isCurrentSession:');
    expect(server).not.toContain('isCurrentSession:');
    expect(server).toContain('isRevoked:');
    expect(server).toMatch(/refreshTokenHash\?:/);
    // Comment may mention server fields; client must not declare the field.
    expect(client).not.toMatch(/^\s*refreshTokenHash\??\s*:/m);
  });

  it('keeps TaskTemplate Client≠Server duals as separate interface bodies', () => {
    const client = readFileSync(resolve(taskAgg, 'task-template-client.ts'), 'utf8');
    const server = readFileSync(resolve(taskAgg, 'task-template-server.ts'), 'utf8');
    expect(client).toContain('Residual 879');
    expect(server).toContain('Residual 879');
    expect(client).toMatch(/export interface TaskTemplateClientDTO\b/);
    expect(server).toMatch(/export interface TaskTemplateServerDTO\b/);
    expect(client).not.toContain('export type TaskTemplateClientDTO = TaskTemplateServerDTO');
    // Client projection extras
    expect(client).toContain('instanceCount:');
    expect(client).toContain('completionRate:');
    expect(server).not.toContain('instanceCount:');
    // Server-only checklist
    expect(server).toContain('checklist:');
    expect(client).not.toContain('checklist:');
  });
});

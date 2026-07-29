import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 251: app-vue dashboard module types keep the client port only.
 * Contract DTOs come from @memoflow/contracts/dashboard (no dual re-export).
 */
describe('app-vue dashboard types export single-track surface', () => {
  const types = readFileSync(resolve(__dirname, 'types.ts'), 'utf8');
  const useDashboard = readFileSync(resolve(__dirname, 'composables/useDashboard.ts'), 'utf8');
  const http = readFileSync(resolve(__dirname, 'adapters/dashboard-http.adapter.ts'), 'utf8');

  it('types.ts exports IDashboardApiClient only (no contracts DTO re-export)', () => {
    expect(types).toContain('export interface IDashboardApiClient');
    expect(types).toContain("from '@memoflow/contracts/dashboard'");
    expect(types).not.toContain('export type {');
    expect(types).not.toMatch(/export type \{[^}]*DashboardData/);
    expect(types).not.toMatch(/export type \{[^}]*DashboardStats/);
    expect(types).not.toMatch(/export type \{[^}]*ActivityItem/);
    expect(types).not.toMatch(/export type \{[^}]*TrendDay/);
  });

  it('composable/adapters import DashboardData from contracts', () => {
    expect(useDashboard).toContain("from '@memoflow/contracts/dashboard'");
    expect(http).toContain("from '@memoflow/contracts/dashboard'");
    expect(useDashboard).not.toMatch(/DashboardData.*from '\.\.\/types'/);
    expect(http).not.toMatch(/DashboardData.*from '\.\.\/types'/);
  });
});

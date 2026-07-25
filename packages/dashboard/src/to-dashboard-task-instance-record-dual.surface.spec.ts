import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  toDashboardTaskInstanceRecord,
  type DashboardTaskInstanceSource,
} from './domain/to-dashboard-task-instance-record';

/**
 * Residual 1156: toDashboardTaskInstanceRecord dual retired (dashboard domain sole).
 * Soft residual 1156: API/Desktop dashboard-read-service host wiring stays separate.
 * Soft residual 1149: toKnowledgeNoteRef Desktop/API keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('toDashboardTaskInstanceRecord dual retired (residual 1156)', () => {
  const dir = __dirname;
  const sole = readFileSync(
    resolve(dir, 'domain/to-dashboard-task-instance-record.ts'),
    'utf8',
  );
  const api = readFileSync(
    resolve(dir, '../../../apps/api/src/modules/dashboard/dashboard-read-service.ts'),
    'utf8',
  );
  const desktop = readFileSync(
    resolve(dir, '../../../apps/desktop/src/main/services/dashboard-read-service.ts'),
    'utf8',
  );
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');

  it('owns sole toDashboardTaskInstanceRecord helper body', () => {
    expect(sole).toContain('Residual 1156');
    expect(sole).toMatch(/export function toDashboardTaskInstanceRecord\b/);
    expect(sole).toContain('String(instance.id)');
    expect(sole).toContain('String(instance.templateId)');
    expect(sole).toContain('instance.updatedAt.getTime()');
    expect(sole).toContain('isOverdue: () => instance.isOverdue()');
    expect(index).toContain('toDashboardTaskInstanceRecord');
  });

  it('retires API/Desktop dual bodies onto sole import', () => {
    for (const [label, source] of [
      ['api', api],
      ['desktop', desktop],
    ] as const) {
      expect(source, label).toContain('toDashboardTaskInstanceRecord');
      expect(source, label).toContain("from '@dailyuse/dashboard'");
      expect(source, label).not.toMatch(/function toDashboardTaskInstanceRecord\b/);
      expect(source, label).toContain('Soft residual 1156');
    }
  });

  it('runtime: maps duck-typed task instance to dashboard record', () => {
    const source: DashboardTaskInstanceSource = {
      id: 42,
      templateId: 'tpl-1',
      status: 'completed',
      instanceDate: 1_700_000_000_000,
      actualEndTime: 1_700_000_100_000,
      updatedAt: new Date('2024-01-02T03:04:05.000Z'),
      deletedAt: null,
      isOverdue: () => false,
    };
    const record = toDashboardTaskInstanceRecord(source);
    expect(record.id).toBe('42');
    expect(record.templateId).toBe('tpl-1');
    expect(record.status).toBe('completed');
    expect(record.instanceDate).toBe(1_700_000_000_000);
    expect(record.actualEndTime).toBe(1_700_000_100_000);
    expect(record.updatedAt).toBe(Date.parse('2024-01-02T03:04:05.000Z'));
    expect(record.deletedAt).toBeNull();
    expect(record.isOverdue()).toBe(false);
  });

  it('documents residual 1156 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'to-dashboard-task-instance-record-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1156');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
